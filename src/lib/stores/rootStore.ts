import {UserStore} from './userStore';
import {LanguageStore} from './languageStore.ts';

export class RootStore {
  userStore: UserStore;
  languageStore: LanguageStore;

  constructor() {
    this.userStore = new UserStore();
    this.languageStore = new LanguageStore();
  }
}

const rootStore = new RootStore();
export default rootStore;
