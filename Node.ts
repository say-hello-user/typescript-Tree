/// <amd-module name="Node"/>
import {Component, IComponent} from "../../Component";
import d = G.d;
import tools = G.tools;
export interface INode extends IComponent{
    isOpen?: boolean;//是否展开
    isSelected?: boolean;//是否选中
    selection?: string;//子项选中方式
    parent?: Node; //父项
    children?: Array<any>;//全部子项
    content?: string;//文本
    isOpenSelected?:boolean;//子项展开能否选中
    isAccordion?:boolean;//是否手风琴
    onSelected  ?(item,afterCb): void; //第一个参数为当前选择的node 第二个为异步加载之后执行的回调函数
    onClick ?(item,afterCb): void;//第一个参数为当前点击的node 第二个为异步加载之后执行的回调函数
    onOpen   ?(item,afterCb): void;//第一个参数为当前打开的node 第二个为异步加载之后执行的回调函数
}

/**
 * 节点组件对象
 */
export class Node extends Component{
    constructor(private node?: INode) {
        super({});
        this.init();
    }
    private init() {
        this._wrapper = d.createByHTML(`<li class="nodeList"></li>`);
        this.content = this.node.content;
        this.children = this.node.children;
        this.isAccordion = this.node.isAccordion;
        this.isOpen = this.node.isOpen;
        this.selection = this.node.selection;
        this.isSelected = this.node.isSelected;
        this.isOpenSelected = this.node.isOpenSelected;
        this.onSelected = this.node.onSelected;
        this.onClick = this.node.onClick;
        this.onOpen = this.node.onOpen;
    }

    //获取所有选中的节点
    getSelected(){
        let tempSelNode : Array<Node> = [];
        function getSel(node : Node){
            if(node.isSelected){
                tempSelNode.push(node);
            }
            if(node.children && node.children.length > 0){
                for(let i = 0,l = node.children.length;i < l;i++){
                    getSel(node.children[i]);
                }
            }
        }
        getSel(this);
        return tempSelNode;
    }

    //获取展开项
    getOpen(){
        let tempOpenNode : Array<Node> = [];
        function getOp(node : Node){
            if(node.isOpen && node.children.length > 0){
                tempOpenNode.push(node);
            }
            if(node.children && node.children.length > 0){
                for(let i = 0,l = node.children.length;i < l;i++){
                    getOp(node.children[i]);
                }
            }
        }
        getOp(this);
        return tempOpenNode;
    }

    //展开全部
    openAll(){
        let child = this.children;
        if(child && child.length > 0){
            for(let i = 0,l = child.length;i < l;i++){
                child[i].isOpen = true;
            }
        }
    }

    //根据guid获取相应的node节点
    getItem(key : string){
        let result = this.getItemByGuid(this,key);
        if(result){
            return result;
        }
        else{
            return "没有找到相应节点";
        }
    }

    //根据guid删除相应的node节点
    delItem(key : string){
        let deleNode = this.getItemByGuid(this,key);
        if(deleNode){
           this.deleNodeByNode(deleNode);
            return true;
        }
       else{
            return false;
        }
    }

    //更新某个节点
    updateItem(newNode : Node){
        let updateNode = this.getItem(newNode.guid);
        if(updateNode.parent){
            let newChild = updateNode.parent.children;
            newChild.splice(newChild.indexOf(updateNode),1);
            newChild.push(newNode);
            updateNode.parent.children = newChild;
        }
    }

    //添加节点
    addItem(newNode){
        let newChild = this.children;
        newNode.parent = this;
        newChild.push(newNode);
        this.children = newChild;
    }

    //删除该节点
    remove(){
        this.deleNodeByNode(this);
        return true;
    }

    //父元素
    protected _parent?: Node;
    set parent(parent : Node) {
       this._parent = parent;
   }
    get parent() {
        return this._parent;
    }

    //节点文本内容
    protected _content?: string;
    set content(content: string) {
        this._content = content;
    }
    get content() {
        return this._content;
    }

    //子节点
    protected _children: Array<any>;
    set children(children: Array<any>) {
        this._children = children;
    }
    get children() {
        return this._children;
    }

    //是否展开
    protected _isOpen?: boolean;
    set isOpen(isOpen: boolean) {
        this._isOpen = tools.valid.isEmpty(isOpen) ? false : isOpen;
    }
    get isOpen() {
        return this._isOpen;
    }

    //是否选中
    protected _isSelected?: boolean;
    set isSelected(isSelected: boolean) {
        this._isSelected = tools.valid.isEmpty(isSelected) ? false : isSelected;
    }
    get isSelected() {
        return this._isSelected;
    }

     //儿子节点选中状态 |  single-单选, multi-多选,none-不能选
    protected _selection?: string;
    set selection(selection: string) {
        //当为单选的时候取消同级节点的选中状态
        this._selection = tools.valid.isEmpty(selection) ? 'multi' : selection;
        setTimeout(()=> {
            if (this.parent && this.parent.selection === 'single') {
                let parChild = this.parent.children;
                let lastOpenChild = null; //用来获取最后一个isSelected为真的对象 当设置为单选的时候  子项又有多个isSelected的时候只设置最后一个isSelected为true
                for(let i = 0,l = parChild.length;i < l;i++) {
                    if(parChild[i].isSelected){
                        lastOpenChild = parChild[i];
                    }
                }
                if (parChild && parChild.length > 0) {
                    for (let i = 0, l = parChild.length; i < l; i++) {
                        if (parChild[i] !== lastOpenChild) {
                            parChild[i].isSelected = false;
                        }
                    }
                }
            }
        },0)
    }
    get selection() {
        return this._selection;
    }

    //子项展开能否选中
    protected _isOpenSelected?: boolean;
    set isOpenSelected(isOpenSelected: boolean) {
        this._isOpenSelected = tools.valid.isEmpty(isOpenSelected) ? false : isOpenSelected;
    }
    get isOpenSelected() {
        return this._isOpenSelected;
    }

    //是否手风琴
    protected _isAccordion?: boolean;
    set isAccordion(isAccordion: boolean) {
        //当父元素设置的手风琴为真的时候取消同级节点的打开状态
        this._isAccordion = tools.valid.isEmpty(isAccordion) ? true : isAccordion;
        setTimeout(()=>{
            if(this.parent && this.parent.isAccordion){
                let parChlid = this.parent.children;
                let lastOpenChild = null; //用来获取最后一个isOpen为真的对象 当设置手风琴的时候  子项又有多个isOpen的时候只设置最后一个isOpen为open
                for(let i = 0,l = parChlid.length;i < l;i++) {
                    if(parChlid[i].isOpen){
                        lastOpenChild = parChlid[i];
                    }
                }
                for(let i = 0,l = parChlid.length;i < l;i++){
                    if(parChlid[i]!==lastOpenChild){
                        parChlid[i].isOpen = false;
                    }
                }
            }
        },0)
    }
    get isAccordion() {
        return this._isAccordion;
    }

    /**
     * 展开或关闭回调,默认触发显示隐藏及样式更改
     */
    protected _onOpen ?(item,afterCb): void;
    set onOpen(callBack) {
        let cb = (item,afterCb)=>{
            if(typeof callBack === 'function' && this.children && this.children.length === 0){
                callBack(item,afterCb);
            }
            else{
                afterCb();
            }
        };
        this._onOpen = cb;
    }
    get onOpen() {
        return this._onOpen;
    }

    /**
     * 选中或取消回调时触发事件,默认触发选中与非选中状态
     */
    protected _onSelected ?(item,afterCb): void;
    set onSelected(callBack) {
        let cb = (item,afterCb)=>{
            if(typeof callBack === 'function'){
                callBack(item,afterCb);
            }
            else{
                afterCb();
            }
        };
        this._onSelected = cb;
    }
    get onSelected() {
        return this._onSelected;
    }

    /**
     * 点击回调
     */
    protected _onClick ?(item,afterCb): void;
    set onClick(callBack) {
        let cb = (item,afterCb)=>{
            if(typeof callBack === 'function'){
                callBack(item,afterCb);
            }
            else{
                afterCb();
            }
        };
        this._onClick = cb;
    }
    get onClick() {
        return this._onClick;
    }

    private getItemByGuid(node : Node,key : string){
        function getNode(node : Node){
            if(node.guid === key)
            {
                return node;
            }
            else{
                if(node.children && node.children.length > 0){
                    for(let i = 0,l = node.children.length;i < l;i++){
                        if(getNode(node.children[i])){
                            return getNode(node.children[i]);
                        }
                    }
                }
            }
        }
        return getNode(node);
    }
    private deleNodeByNode(deleNode : Node){
        if(deleNode.wrapper.parentElement.nodeName === 'LI'){
            deleNode.wrapper.parentElement.remove();
        }
        deleNode.wrapper.remove();
        if(deleNode.parent){ //如果有父元素  则在父元素的children中删除自己
            let childs = deleNode.parent.children,
                index = childs.indexOf(deleNode);
            if(index !== -1){
                childs.splice(index,1);
            }
        }
    }
}