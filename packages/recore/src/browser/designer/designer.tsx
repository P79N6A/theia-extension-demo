import * as React from "react";
import { SocketProvider } from "../socket-provider";
import { IPage } from "../page";
import { RecoreFSService } from '../edtior-services/recore-fs-service';
import { RecoreLSService } from "../edtior-services/recore-ls-service";
import { getStaticURLPrefix } from '../config';

export class Designer extends React.Component {
    /**
     * iframe 实例
     */
    public readonly ref = React.createRef<HTMLIFrameElement>();

    private readonly id: string;
    private readonly name: string;
    private readonly page: IPage;
    private readonly socketProvider: SocketProvider;
    private readonly fs: RecoreFSService;
    private readonly rls: RecoreLSService;

    constructor(props: {
        name: string,
        id: string,
        page: IPage,
        socketProvider: SocketProvider,
        fs: RecoreFSService,
        rls: RecoreLSService
    }) {
        super(props);
        this.id = props.id;
        this.page = props.page;
        this.socketProvider = props.socketProvider;
        this.fs = props.fs;
        this.rls = props.rls;

        const { name, files: { ctrl } } = this.page;
        const ctrlName = ctrl ? ctrl.replace(/\.(ts|js)/, '') : '';
        const pagePath = `${name}/${ctrlName}`;
        this.rls.init(pagePath);
    }

    componentDidMount() {
        this.createDesigner();
    }

    render () {
        return <iframe
            name={this.id}
            style={{background: 'white'}}
            ref={this.ref}/>;
    }

    private getV3Html(): string {
        const { V3_BASE_URL } = (window as any).g_config as any || { V3_BASE_URL: 'https://g-assets.daily.taobao.net/limitless/ide-designer/0.9.3' };

        if (V3_BASE_URL) {
            const prefix = V3_BASE_URL.replace(/\/$/, '');
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>${this.name} - Design</title>
                    <link rel="shortcut icon" type="image/png" href="https://img.alicdn.com/tfs/TB1zgoCemrqK1RjSZK9XXXyypXa-96-96.png" />
                    <link rel="stylesheet" href="${prefix}/app.min.css">
                    <link rel="stylesheet" href="${prefix}/simulator-recore.min.css">
                    <script src="https://g.alicdn.com/mylib/??react/16.6.3/umd/react.development.js,react-dom/16.6.3/umd/react-dom.development.js,prop-types/15.6.2/prop-types.js"></script>
                    <script> 
                        window.g_config = {
                          STATIC_URL_PREFIX: '${getStaticURLPrefix()}',
                        }
                        React.PropTypes = PropTypes;
                    </script>
                    <script src="https://g.alicdn.com/mylib/@ali/recore/1.4.0/umd/recore.min.js"></script>
                    <script src="https://g.alicdn.com/mylib/my-babel/0.9.2/umd/my-babel.min.js"></script>
                    <script src="https://g.alicdn.com/mylib/@ali/my-prettier/1.0.0/dist/my-prettier.min.js"></script>
                </head>
                <body>
                    <script src="${prefix}/app.min.js"></script>
                    <script src="${prefix}/simulator-recore.min.js"></script>
                </body>
                </html>        
            `;
        }

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${this.name} - Design</title>
                <link rel="shortcut icon" type="image/png" href="https://img.alicdn.com/tfs/TB1zgoCemrqK1RjSZK9XXXyypXa-96-96.png" />
                <script src="https://g.alicdn.com/mylib/??react/16.6.3/umd/react.development.js,react-dom/16.6.3/umd/react-dom.development.js,prop-types/15.6.2/prop-types.js"></script>
                <script> 
                  window.g_config = {
                    STATIC_URL_PREFIX: '${getStaticURLPrefix()}',
                  }
                  React.PropTypes = PropTypes; 
                </script>
                <script src="https://g.alicdn.com/mylib/@ali/recore/1.4.0/umd/recore.min.js"></script>
                <script src="https://g.alicdn.com/mylib/my-babel/0.9.2/umd/my-babel.min.js"></script>
                <script src="https://g.alicdn.com/mylib/@ali/my-prettier/1.0.0/dist/my-prettier.min.js"></script>
            </head>
            <body>
                <script src="http://127.0.0.1:8080/__assets/v3.js"></script>
                <script src="http://127.0.0.1:8080/__assets/simulator-recore.js"></script>
            </body>
            </html>
        `;
    }

    private async createDesigner () {
        const iframe = this.ref.current!;
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;

        if (!win || !doc) {
            requestAnimationFrame(() => {
                this.createDesigner();
            });
            return;
        }

        (win as any).__editor__ = {
            currentPage: this.page,
            websocketProvider: this.socketProvider,
            fs: this.fs,
            rls: this.rls
        } as any;

        // write v3 html to iframe
        doc.open();
        doc.write(this.getV3Html());
        doc.close();

    }
}
