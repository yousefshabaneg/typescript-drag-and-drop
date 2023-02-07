namespace App {
  export enum ProjectStatus {
    Active,
    Finished,
  }

  //Project Type
  export class Project {
    constructor(
      public id: number,
      public title: string,
      public description: string,
      public people: number,
      public status: ProjectStatus
    ) {}
  }
}
