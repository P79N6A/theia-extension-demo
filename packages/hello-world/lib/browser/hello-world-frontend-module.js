"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var inversify_1 = require("inversify");
var core_1 = require("@theia/core");
var command_contribution_1 = require("./command-contribution");
var menu_contribution_1 = require("./menu-contribution");
exports.default = new inversify_1.ContainerModule(function (bind) {
    // add your contribution bindings here
    bind(core_1.CommandContribution).to(command_contribution_1.HelloWorldCommandContribution);
    bind(core_1.MenuContribution).to(menu_contribution_1.HelloWorldMenuContribution);
});
//# sourceMappingURL=hello-world-frontend-module.js.map