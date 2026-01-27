import { Injectable, InternalServerErrorException } from '@nestjs/common';

interface GraphTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GraphInvitationResponse {
  id?: string;
  inviteRedeemUrl?: string;
  invitedUser?: {
    id?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

interface InviteUserParams {
  email: string;
  redirectUrl: string;
  displayName?: string;
  sendInvitationMessage?: boolean;
}

@Injectable()
export class AdminEntraGraphService {
  private cachedToken: { token: string; expiresAt: number } | null = null;

  private getEnv(name: string): string | null {
    const value = process.env[name];
    return value && value.trim() ? value.trim() : null;
  }

  private getRequiredEnv(name: string): string {
    const value = this.getEnv(name);
    if (!value) {
      throw new InternalServerErrorException(
        `Missing required environment variable: ${name}`,
      );
    }
    return value;
  }

  private getTenantId(): string {
    // Support either ENTRA_TENANT_ID or AZURE_TENANT_ID.
    return (
      this.getEnv('ENTRA_TENANT_ID') ||
      this.getEnv('AZURE_TENANT_ID') ||
      this.getRequiredEnv('ENTRA_TENANT_ID')
    );
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && now < this.cachedToken.expiresAt) {
      return this.cachedToken.token;
    }

    const tenantId = this.getTenantId();
    const clientId = this.getRequiredEnv('ENTRA_CLIENT_ID');
    const clientSecret = this.getRequiredEnv('ENTRA_CLIENT_SECRET');
    const scope =
      this.getEnv('ENTRA_GRAPH_SCOPE') || 'https://graph.microsoft.com/.default';

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope,
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const json = (await response.json()) as GraphTokenResponse;
    if (!response.ok || !json.access_token) {
      const detail = json.error_description || json.error || 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to acquire Graph token: ${detail}`,
      );
    }

    const expiresInMs = Math.max((json.expires_in || 3600) * 1000 - 60_000, 60_000);
    this.cachedToken = {
      token: json.access_token,
      expiresAt: now + expiresInMs,
    };

    return json.access_token;
  }

  async inviteUser(params: InviteUserParams) {
    const accessToken = await this.getAccessToken();

    const response = await fetch('https://graph.microsoft.com/v1.0/invitations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invitedUserEmailAddress: params.email,
        inviteRedirectUrl: params.redirectUrl,
        sendInvitationMessage: params.sendInvitationMessage ?? true,
        invitedUserDisplayName: params.displayName,
      }),
    });

    const json = (await response.json()) as GraphInvitationResponse;
    if (!response.ok || json.error) {
      const detail =
        json.error?.message || `Graph invitation failed with status ${response.status}`;
      throw new InternalServerErrorException(detail);
    }

    return {
      invitationId: json.id || null,
      invitedUserId: json.invitedUser?.id || null,
      inviteRedeemUrl: json.inviteRedeemUrl || null,
    };
  }
}

