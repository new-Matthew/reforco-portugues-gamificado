export interface TutorialStore {
  loadCompleted(): Promise<boolean | null>;
  saveCompleted(completed: boolean): Promise<void>;
}
