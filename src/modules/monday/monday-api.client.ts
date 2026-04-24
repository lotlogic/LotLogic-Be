import { Logger } from '@nestjs/common';

export interface MondayApiConfig {
  apiToken: string;
  apiBaseUrl: string;
  apiVersion: string;
}

export interface MondayItemSummary {
  id: string;
  name: string;
  group: {
    id: string;
    title: string;
  } | null;
  columnValues: Array<{
    id: string;
    text: string;
    value: string | null;
  }>;
}

export interface MondayBoardItemsOptions {
  limit?: number;
  columnIds?: string[];
}

export interface MondayColumnValuesLookup {
  columnId: string;
  columnValues: string[];
  limit?: number;
  columnIds?: string[];
}

export class MondayApiClient {
  constructor(
    private readonly config: MondayApiConfig,
    private readonly logger: Logger,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async listBoardItems(
    boardId: string,
    limitOrOptions: number | MondayBoardItemsOptions = 500,
  ): Promise<MondayItemSummary[]> {
    const options =
      typeof limitOrOptions === 'number'
        ? { limit: limitOrOptions }
        : limitOrOptions;
    const limit = options.limit ?? 500;
    const hasColumnFilter = Boolean(options.columnIds?.length);
    const columnValuesFragment = hasColumnFilter
      ? 'column_values(ids: $columnIds) { id text value }'
      : 'column_values { id text value }';
    const columnIdsVariableDefinition = hasColumnFilter
      ? ', $columnIds: [String!]'
      : '';
    const query = `query ($boardId: ID!, $limit: Int!${columnIdsVariableDefinition}) {
      boards(ids: [$boardId]) {
        items_page(limit: $limit) {
          items {
            id
            name
            group { id title }
            ${columnValuesFragment}
          }
        }
      }
    }`;

    const variables: Record<string, unknown> = {
      boardId,
      limit,
    };

    if (hasColumnFilter) {
      variables.columnIds = options.columnIds;
    }

    const response = await this.graphql<{
      boards: Array<{
        items_page: {
          items: Array<{
            id: string;
            name: string;
            group?: { id: string; title: string } | null;
            column_values?: Array<{
              id: string;
              text?: string | null;
              value?: string | null;
            }>;
          }>;
        };
      }>;
    }>(query, variables);

    return (
      response.boards[0]?.items_page.items.map((item) => ({
        ...this.mapItemSummary(item),
      })) ?? []
    );
  }

  async getItemsByIds(
    itemIds: string[],
    options: { columnIds?: string[] } = {},
  ): Promise<MondayItemSummary[]> {
    const ids = itemIds
      .map((itemId) => String(itemId || '').trim())
      .filter(Boolean);

    if (!ids.length) {
      return [];
    }

    const response = await this.graphql<{
      items: Array<{
        id: string;
        name: string;
        group?: { id: string; title: string } | null;
        column_values?: Array<{
          id: string;
          text?: string | null;
          value?: string | null;
        }>;
      }>;
    }>(
      `query {
        items(ids: ${serializeGraphqlStringArray(ids)}) {
          id
          name
          group { id title }
          ${this.buildColumnValuesFragment(options.columnIds)}
        }
      }`,
      {},
    );

    return (response.items ?? []).map((item) => this.mapItemSummary(item));
  }

  async listItemsByColumnValues(
    boardId: string,
    params: MondayColumnValuesLookup,
  ): Promise<MondayItemSummary[]> {
    const columnValues = params.columnValues
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    if (!columnValues.length) {
      return [];
    }

    const limit = Number.isFinite(params.limit) ? Number(params.limit) : 25;

    const response = await this.graphql<{
      items_page_by_column_values: {
        items: Array<{
          id: string;
          name: string;
          group?: { id: string; title: string } | null;
          column_values?: Array<{
            id: string;
            text?: string | null;
            value?: string | null;
          }>;
        }>;
      } | null;
    }>(
      `query {
        items_page_by_column_values(
          board_id: ${JSON.stringify(boardId)},
          columns: [{
            column_id: ${JSON.stringify(params.columnId)},
            column_values: ${serializeGraphqlStringArray(columnValues)}
          }],
          limit: ${limit}
        ) {
          items {
            id
            name
            group { id title }
            ${this.buildColumnValuesFragment(params.columnIds)}
          }
        }
      }`,
      {},
    );

    return (response.items_page_by_column_values?.items ?? []).map((item) =>
      this.mapItemSummary(item),
    );
  }

  async createItem(
    boardId: string,
    groupId: string,
    itemName: string,
  ): Promise<{ id: string; name: string }> {
    const response = await this.graphql<{
      create_item: {
        id: string;
        name: string;
      };
    }>(
      `mutation ($boardId: ID!, $groupId: String!, $itemName: String!) {
        create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName) {
          id
          name
        }
      }`,
      {
        boardId,
        groupId,
        itemName,
      },
    );

    return response.create_item;
  }

  async changeMultipleColumnValues(
    boardId: string,
    itemId: string,
    columnValues: Record<string, unknown>,
  ): Promise<{ id: string; name: string }> {
    const response = await this.graphql<{
      change_multiple_column_values: {
        id: string;
        name: string;
      };
    }>(
      `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(
          board_id: $boardId,
          item_id: $itemId,
          column_values: $columnValues
        ) {
          id
          name
        }
      }`,
      {
        boardId,
        itemId,
        columnValues: serializeMondayColumnValues(columnValues),
      },
    );

    return response.change_multiple_column_values;
  }

  private buildColumnValuesFragment(columnIds?: string[]): string {
    const filteredIds = (columnIds ?? [])
      .map((columnId) => String(columnId || '').trim())
      .filter(Boolean);

    if (!filteredIds.length) {
      return 'column_values { id text value }';
    }

    return `column_values(ids: ${serializeGraphqlStringArray(filteredIds)}) { id text value }`;
  }

  private mapItemSummary(item: {
    id: string;
    name: string;
    group?: { id: string; title: string } | null;
    column_values?: Array<{
      id: string;
      text?: string | null;
      value?: string | null;
    }>;
  }): MondayItemSummary {
    return {
      id: item.id,
      name: item.name,
      group: item.group ?? null,
      columnValues: (item.column_values ?? []).map((columnValue) => ({
        id: columnValue.id,
        text: columnValue.text ?? '',
        value: columnValue.value ?? null,
      })),
    };
  }

  private async graphql<TData>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<TData> {
    const response = await this.fetchImpl(this.config.apiBaseUrl, {
      method: 'POST',
      headers: {
        Authorization: this.config.apiToken,
        'API-Version': this.config.apiVersion,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const json = (await response.json()) as {
      data?: TData;
      errors?: Array<{ message?: string }>;
    };

    if (!response.ok || json.errors?.length) {
      this.logger.error('Monday API request failed', {
        status: response.status,
        errors: json.errors?.map((error) => error.message ?? 'Unknown error'),
      });
      throw new Error(
        `Monday API request failed: ${response.status} ${json.errors?.map((error) => error.message).join('; ') ?? ''}`.trim(),
      );
    }

    if (!json.data) {
      throw new Error('Monday API request returned no data payload.');
    }

    return json.data;
  }
}

function serializeMondayColumnValues(
  columnValues: Record<string, unknown>,
): string {
  const sanitizedEntries = Object.entries(columnValues).filter(
    ([, value]) => value !== null && value !== undefined,
  );
  return JSON.stringify(Object.fromEntries(sanitizedEntries));
}

function serializeGraphqlStringArray(values: string[]): string {
  return `[${values.map((value) => JSON.stringify(value)).join(', ')}]`;
}
