import {UserStore} from './userStore';
import {LanguageStore} from './languageStore.ts';
import {UIStore} from './uiStore.ts';

export class RootStore {
  userStore: UserStore;
  languageStore: LanguageStore;
  uiStore: UIStore;

  constructor() {
    this.userStore = new UserStore();
    this.languageStore = new LanguageStore();
    this.uiStore = new UIStore();
  }
}

const rootStore = new RootStore();
export default rootStore;
