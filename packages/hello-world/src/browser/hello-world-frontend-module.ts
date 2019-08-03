import { ContainerModule } from 'inversify';
import { CommandContribution, MenuContribution } from '@theia/core';
import { HelloWorldCommandContribution } from './command-contribution';
import { HelloWorldMenuContribution } from './menu-contribution';

export default new ContainerModule(bind => {
  // add your contribution bindings here
  bind(CommandContribution).to(HelloWorldCommandContribution);
  bind(MenuContribution).to(HelloWorldMenuContribution);
});