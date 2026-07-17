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
    address: MondayColumnDefinition;
    zone: MondayColumnDefinition;
    blockSizeM2: MondayColumnDefinition;
  };
  statusLabels: {
    leadSource: {
      freeAssessment: string;
    };
  };
}
