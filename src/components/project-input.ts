import { autobind } from "./../decorators/autobind";
import { projectState } from "./../state/project-state";
import { Validatable, validate } from "./../utils/validation";
import { Component } from "./base-component";

//ProjectInput Class
export class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
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
