/********************************************************************************
 * Copyright (C) 2019 Alibaba and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable } from 'inversify';
import * as fileIcons from 'file-icons-js';
import URI from '@theia/core/lib/common/uri';
import { DefaultUriLabelProviderContribution } from '@theia/core/lib/browser/label-provider';

export const VX_ICON = 'vx-icon';

@injectable()
export class FCDefaultUriLabelProviderContribution extends DefaultUriLabelProviderContribution {
    protected getFileIcon(uri: URI): string | undefined {
        const icon = fileIcons.getClassWithColor(uri.displayName);
        const reg = /\w+\.vx/;
        if (!icon && reg.test(uri.displayName)) {
            return VX_ICON;
        }
        return icon;
    }
}