/// <reference path="drag-drop-interfaces.ts" />
/// <reference path="project-model.ts" />

namespace App {
  // Practice : Drag and Drop

  type Listener<T> = (items: T[]) => void;

  // State Base

  class State<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
      this.listeners.push(listenerFn);
    }
  }

  // Project State Management
  class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;
    private constructor() {
      super();
    }

    static getInstance() {
      if (!this.instance) this.instance = new ProjectState();
      return this.instance;
    }

    addProject(title: string, description: string, people: number) {
      const newProject = new Project(
        Date.now(),
        title,
        description,
        people,
        ProjectStatus.Active
      );
      this.projects.push(newProject);
      this.notifyListeners();
    }

    moveProject(projectId: number, newStatus: ProjectStatus) {
      const project = this.projects.find((p) => p.id === projectId);
      if (project && project.status !== newStatus) {
        project.status = newStatus;
        this.notifyListeners();
      }
    }

    private notifyListeners() {
      for (const listenerFn of this.listeners) {
        listenerFn(this.projects.slice());
      }
    }
  }

  const projectState = ProjectState.getInstance();

  //Validation
  interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  }

  function validate(validatableInput: Validatable) {
    let isValid = true;

    if (validatableInput.required) {
      isValid =
        isValid && validatableInput.value.toString().trim().length !== 0;
    }

    if (typeof validatableInput.value === "string") {
      if (validatableInput.minLength != null) {
        isValid =
          isValid &&
          validatableInput.value.trim().length >= validatableInput.minLength;
      }

      if (validatableInput.maxLength != null) {
        isValid =
          isValid &&
          validatableInput.value.trim().length <= validatableInput.maxLength;
      }
    } else {
      if (validatableInput.min) {
        isValid = isValid && validatableInput.value >= validatableInput.min;
      }

      if (validatableInput.max) {
        isValid = isValid && validatableInput.value <= validatableInput.max;
      }
    }

    return isValid;
  }

  //autobind decorator
  function autobind(
    _: any,
    __: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
      configurable: true,
      get() {
        const boundFn = originalMethod.bind(this);
        return boundFn;
      },
    };
    return adjDescriptor;
  }

  // Component Base Class
  abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(
      templateId: string,
      hostElementId: string,
      insertAtStart: boolean,
      newElementId?: string
    ) {
      this.templateElement = document.getElementById(
        templateId
      )! as HTMLTemplateElement;
      this.hostElement = document.getElementById(hostElementId) as T;

      const importedNode = document.importNode(
        this.templateElement.content,
        true
      );
      this.element = importedNode.firstElementChild as U;
      if (newElementId) this.element.id = newElementId;

      this.attach(insertAtStart);
    }

    private attach(insertAtStart: boolean) {
      this.hostElement.insertAdjacentElement(
        insertAtStart ? "afterbegin" : "beforeend",
        this.element
      );
    }

    abstract configure?(): void;
    abstract renderContent(): void;
  }

  // ProjectItem Class
  class ProjectItem
    extends Component<HTMLUListElement, HTMLLIElement>
    implements Draggable
  {
    private project: Project;

    get persons() {
      const isPlural = this.project.people === 1 ? "" : "s";
      return `${this.project.people} person${isPlural}`;
    }

    constructor(hostId: string, project: Project) {
      super("single-project", hostId, false, `${project.id}`);
      this.project = project;

      this.configure();
      this.renderContent();
    }

    @autobind
    dragStartHandler(event: DragEvent) {
      event.dataTransfer!.setData("text/plain", `${this.project.id}`);
      event.dataTransfer!.effectAllowed = "move";
    }

    @autobind
    dragEndHandler(event: DragEvent) {
      console.log("Drag End");
    }

    configure() {
      this.element.addEventListener("dragstart", this.dragStartHandler);
      this.element.addEventListener("dragend", this.dragEndHandler);
    }
    renderContent() {
      this.element.querySelector("h2")!.textContent = this.project.title;
      this.element.querySelector(
        "h3"
      )!.textContent = `${this.persons} assigned`;
      this.element.querySelector("p")!.textContent = this.project.description;
    }
  }

  //ProjectList Class
  class ProjectList
    extends Component<HTMLDivElement, HTMLElement>
    implements DragTarget
  {
    assignedProjects: Project[] = [];
    constructor(private type: "active" | "finished") {
      super("project-list", "app", false, `${type}-projects`);
      this.templateElement = document.getElementById(
        "project-list"
      )! as HTMLTemplateElement;
      this.configure();
      this.renderContent();
    }

    @autobind
    dragOverHandler(event: DragEvent) {
      if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
        event.preventDefault();
        const listEl = this.element.querySelector("ul")!;
        listEl.classList.add("droppable");
      }
    }

    @autobind
    dragLeaveHandler(event: DragEvent) {
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.remove("droppable");
    }

    @autobind
    dropHandler(event: DragEvent) {
      const projectId = +event.dataTransfer!.getData("text/plain");
      const newStatus =
        this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished;
      projectState.moveProject(projectId, newStatus);
    }

    renderContent() {
      const listId = `${this.type}-projects-list`;
      this.element.querySelector("ul")!.id = listId;
      this.element.querySelector(
        "h2"
      )!.textContent = `${this.type.toUpperCase()} PROJECTS`;
    }

    configure() {
      this.element.addEventListener("dragover", this.dragOverHandler);
      this.element.addEventListener("dragleave", this.dragLeaveHandler);
      this.element.addEventListener("drop", this.dropHandler);

      projectState.addListener((projects: Project[]) => {
        const relevantProjects = projects.filter((p) => {
          if (this.type === "active") {
            return p.status === ProjectStatus.Active;
          }
          return p.status === ProjectStatus.Finished;
        });
        this.assignedProjects = relevantProjects;
        this.renderProjects();
      });
    }

    private renderProjects() {
      const listEl = document.getElementById(
        `${this.type}-projects-list`
      )! as HTMLUListElement;
      listEl.innerHTML = "";
      for (const proj of this.assignedProjects) {
        new ProjectItem(listEl.id, proj);
      }
    }
  }

  //ProjectInput Class
  class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;
    constructor() {
      super("project-input", "app", true, "user-input");

      this.titleInputElement = this.getInputElement("#title");
      this.descriptionInputElement = this.getInputElement("#description");
      this.peopleInputElement = this.getInputElement("#people");

      this.configure();
    }

    configure() {
      this.element.addEventListener("submit", this.submitHandler);
    }

    renderContent() {}

    private getInputElement(elementId: string): HTMLInputElement {
      return this.element.querySelector(elementId) as HTMLInputElement;
    }

    private gatherUserInput(): [string, string, number] | void {
      const title = this.titleInputElement.value;
      const description = this.descriptionInputElement.value;
      const people = this.peopleInputElement.value;

      const titleValidatable: Validatable = {
        value: title,
        required: true,
      };

      const descriptionValidatable: Validatable = {
        value: description,
        required: true,
        minLength: 5,
      };

      const peopleValidatable: Validatable = {
        value: people,
        required: true,
        min: 1,
        max: 5,
      };
      if (
        !validate(titleValidatable) ||
        !validate(descriptionValidatable) ||
        !validate(peopleValidatable)
      ) {
        return alert("Invalid input, please try again.");
      }
      return [title, description, +people];
    }

    private clearInputs() {
      this.titleInputElement.value = "";
      this.peopleInputElement.value = "";
      this.descriptionInputElement.value = "";
    }

    @autobind
    private submitHandler(event: Event) {
      event.preventDefault();
      const userInput = this.gatherUserInput();
      if (!Array.isArray(userInput)) {
        return;
      }

      const [title, desc, people] = userInput;
      projectState.addProject(title, desc, people);
      this.clearInputs();
    }
  }

  new ProjectList("active");
  new ProjectList("finished");
  new ProjectInput();
}
