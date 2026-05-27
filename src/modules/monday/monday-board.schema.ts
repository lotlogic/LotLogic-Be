export interface MondayColumnDefinition {
  id: string;
  title: string;
  type: string;
}

export interface BlockplannerPaidReportsBoardSchema {
  boardId: string;
  boardName: string;
  defaultGroupId: string;
  columns: {
    name: MondayColumnDefinition;
    date: MondayColumnDefinition;
    email: MondayColumnDefinition;
    phone: MondayColumnDefinition;
    reportId: MondayColumnDefinition;
    address: MondayColumnDefinition;
    suburb: MondayColumnDefinition;
    blockSizeM2: MondayColumnDefinition;
    zone: MondayColumnDefinition;
    frontageM: MondayColumnDefinition;
    housePosition: MondayColumnDefinition;
    houseFootprintM2: MondayColumnDefinition;
    rearYardDepthM: MondayColumnDefinition;
    largeTreesVisible: MondayColumnDefinition;
    treeLocation: MondayColumnDefinition;
    registeredTrees: MondayColumnDefinition;
    heritageOverlay: MondayColumnDefinition;
    sewerLocation: MondayColumnDefinition;
    easementImpact: MondayColumnDefinition;
    shedInRear: MondayColumnDefinition;
    secondDrivewayFeasible: MondayColumnDefinition;
    mapImageUrl: MondayColumnDefinition;
    maxBuildingAllowedM2: MondayColumnDefinition;
    remainingSiteCoverageM2: MondayColumnDefinition;
    rearYardCategory: MondayColumnDefinition;
    grannyFlatKeepHouse: MondayColumnDefinition;
    dualOccRemoveHouse: MondayColumnDefinition;
    subdivisionPotential: MondayColumnDefinition;
    analystAssigned: MondayColumnDefinition;
    sendForQa: MondayColumnDefinition;
    qaCompleted: MondayColumnDefinition;
    finalPdfLink: MondayColumnDefinition;
    deliveryStatus: MondayColumnDefinition;
    deliveryDate: MondayColumnDefinition;
    escalation: MondayColumnDefinition;
    internalNotes: MondayColumnDefinition;
    intention: MondayColumnDefinition;
    stripePaymentId: MondayColumnDefinition;
  };
  statusLabels: {
    yes: string;
    no: string;
    treeLocation: {
      north: string;
      south: string;
      east: string;
      west: string;
      multiple: string;
      middleOfBlock: string;
      notApplicable: string;
    };
    registeredTrees: {
      none: string;
      oneTree: string;
      multipleTrees: string;
      protected: string;
      unknown: string;
      yes: string;
      no: string;
    };
    deliveryStatus: {
      sent: string;
      notStarted: string;
      readyToSend: string;
    };
    intention: {
      openToOptions: string;
      jointVenture: string;
      sell: string;
      developMyself: string;
    };
  };
}

export interface BlockplannerLeadsBoardSchema {
  boardId: string;
  boardName: string;
  defaultGroupId: string;
  columns: {
    name: MondayColumnDefinition;
    email: MondayColumnDefinition;
    leadSource: MondayColumnDefinition;
  };
  statusLabels: {
    leadSource: {
      freeAssessment: string;
    };
  };
}

export const BLOCKPLANNER_PAID_REPORTS_BOARD_SCHEMA: BlockplannerPaidReportsBoardSchema =
  {
    boardId: '5028030238',
    boardName: 'BlockPlanner - Paid Reports',
    defaultGroupId: 'group_mm2qpyaz',
    columns: {
      name: { id: 'name', title: 'Name', type: 'name' },
      date: { id: 'date4', title: 'Date', type: 'date' },
      email: { id: 'email_mm2qyev6', title: 'Email', type: 'email' },
      phone: { id: 'phone_mm2qj30e', title: 'Phone', type: 'phone' },
      reportId: { id: 'text_mm2qdpk3', title: 'Report ID', type: 'text' },
      address: { id: 'text_mm2q5m86', title: 'Address', type: 'text' },
      suburb: { id: 'text_mm2qdnv', title: 'Suburb', type: 'text' },
      blockSizeM2: {
        id: 'text_mm2qq969',
        title: 'Block size (m²)',
        type: 'text',
      },
      zone: { id: 'text_mm2qt7de', title: 'Zone', type: 'text' },
      frontageM: { id: 'text_mm2q4sjh', title: 'Frontage (m)', type: 'text' },
      housePosition: {
        id: 'color_mm2q3shy',
        title: 'House position',
        type: 'status',
      },
      houseFootprintM2: {
        id: 'text_mm2q5p1t',
        title: 'House footprint (m²)',
        type: 'text',
      },
      rearYardDepthM: {
        id: 'text_mm2q2f36',
        title: 'Rear yard depth (m)',
        type: 'text',
      },
      largeTreesVisible: {
        id: 'text_mm2qj6ag',
        title: 'Large trees visible',
        type: 'text',
      },
      treeLocation: {
        id: 'dropdown_mm35539t',
        title: 'Tree location',
        type: 'dropdown',
      },
      registeredTrees: {
        id: 'dropdown_mm35eqsb',
        title: 'Registered trees',
        type: 'dropdown',
      },
      heritageOverlay: {
        id: 'color_mm2qkyrj',
        title: 'Heritage overlay',
        type: 'status',
      },
      sewerLocation: {
        id: 'color_mm2q6rf7',
        title: 'Sewer location',
        type: 'status',
      },
      easementImpact: {
        id: 'color_mm2q318b',
        title: 'Easement impact',
        type: 'status',
      },
      shedInRear: {
        id: 'color_mm2qvqyz',
        title: 'Shed in rear',
        type: 'status',
      },
      secondDrivewayFeasible: {
        id: 'color_mm2qvw3d',
        title: 'Second driveway feasible',
        type: 'status',
      },
      mapImageUrl: {
        id: 'text_mm2q52wb',
        title: 'Map image URL',
        type: 'text',
      },
      maxBuildingAllowedM2: {
        id: 'numeric_mm2qqs6r',
        title: 'Max building allowed (m²)',
        type: 'numbers',
      },
      remainingSiteCoverageM2: {
        id: 'numeric_mm2q79hj',
        title: 'Remaining site coverage (m²)',
        type: 'numbers',
      },
      rearYardCategory: {
        id: 'color_mm2qg5j7',
        title: 'Rear yard category',
        type: 'status',
      },
      grannyFlatKeepHouse: {
        id: 'color_mm2qjpg',
        title: 'Granny flat (keep house)',
        type: 'status',
      },
      dualOccRemoveHouse: {
        id: 'color_mm2qykxa',
        title: 'Dual occ (remove house)',
        type: 'status',
      },
      subdivisionPotential: {
        id: 'color_mm2qb7x2',
        title: 'Subdivision potential',
        type: 'status',
      },
      analystAssigned: {
        id: 'text_mm2q9z3a',
        title: 'Analyst assigned',
        type: 'text',
      },
      sendForQa: {
        id: 'color_mm2qzcdq',
        title: 'send for QA?',
        type: 'status',
      },
      qaCompleted: {
        id: 'color_mm2q6kew',
        title: 'QA completed',
        type: 'status',
      },
      finalPdfLink: {
        id: 'text_mm2q9pd4',
        title: 'Final PDF link',
        type: 'text',
      },
      deliveryStatus: {
        id: 'color_mm2qeye7',
        title: 'Delivery status',
        type: 'status',
      },
      deliveryDate: {
        id: 'date_mm2qqqss',
        title: 'Delivery date',
        type: 'date',
      },
      escalation: {
        id: 'color_mm2qccgd',
        title: 'Escalation',
        type: 'status',
      },
      internalNotes: {
        id: 'text_mm2qqyyx',
        title: 'Internal notes',
        type: 'text',
      },
      intention: {
        id: 'color_mm2qfth',
        title: 'Intention',
        type: 'status',
      },
      stripePaymentId: {
        id: 'text_mm2qmdth',
        title: 'Stripe payment id',
        type: 'text',
      },
    },
    statusLabels: {
      yes: 'Yes',
      no: 'No',
      treeLocation: {
        north: 'north',
        south: 'south',
        east: 'east',
        west: 'west',
        multiple: 'multiple',
        middleOfBlock: 'middle of block',
        notApplicable: 'N/A',
      },
      registeredTrees: {
        none: 'None',
        oneTree: '1 Tree',
        multipleTrees: '2+ Trees',
        protected: 'Protected',
        unknown: 'Unknown',
        yes: 'Yes',
        no: 'No',
      },
      deliveryStatus: {
        sent: 'Sent',
        notStarted: 'Not Started',
        readyToSend: 'Ready to Send',
      },
      intention: {
        openToOptions: 'Open to options',
        jointVenture: 'Joint Venture',
        sell: 'Sell',
        developMyself: 'Develop Myself',
      },
    },
  };

export const BLOCKPLANNER_LEADS_BOARD_SCHEMA: BlockplannerLeadsBoardSchema = {
  boardId: '5028030146',
  boardName: 'Leads',
  defaultGroupId: 'topics',
  columns: {
    name: { id: 'name', title: 'Name', type: 'name' },
    email: { id: 'lead_email', title: 'Email', type: 'email' },
    leadSource: {
      id: 'color_mkyb8krc',
      title: 'Lead Source',
      type: 'status',
    },
  },
  statusLabels: {
    leadSource: {
      freeAssessment: 'BlockPlanner Free Assessment',
    },
  },
};
