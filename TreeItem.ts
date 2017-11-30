/// <amd-module name="TreeItem"/>
import {INode, Node} from "../../navigation/node/Node";
import d = G.d;
import tools = G.tools;
interface ITreeItem extends INode{
    icon? : string;
    color? : string;
}
/**
 * 树节点组件对象
 */
export class TreeItem extends Node{
    constructor(private treeItem: ITreeItem) {
        super(treeItem);

        this.icon = treeItem.icon;
        this.color = treeItem.color;

        this.initTreeItem();
    }

    //节点文本内容
    set content(content: string) {
        this._content = content;
        let itemText = d.query('.itemText',this.wrapper);
        //先查询 用来判断是否已经设置的content 如果设置了content则只需要重新设置content的innerText
        if(itemText){
            itemText.innerText = content;
        }
        else{
            let itemWrapper = d.createByHTML(`<div class = 'itemWrapper'></div>`);
            let textSpan = d.createByHTML(`<span class = 'itemText'>${content}</span>`);
            d.append(itemWrapper,textSpan);
            d.append(this.wrapper,itemWrapper);
        }
    }
    get content() {
        return this._content;
    }

    //子节点
    set children(children: Array<TreeItem>) {
        let isFirst =  this.children ? false : true;
        this._children = tools.valid.isEmpty(children) ? [] : children;
        //如果已经设置过children则重新设置children的值 第二次设children
        if(!isFirst){
            //首先在页面中清除该子节点
            let liWrapper = d.query('.liWrapper',this.wrapper);
            liWrapper && this.wrapper.removeChild(liWrapper);
        }
        //第一次或者重新渲染子节点
        if(this.children && this.children.length > 0){
            let ul = d.createByHTML(`<ul class="liWrapper liWrapperLine hideTree"></ul>`);
            for(let i = 0,l = this.children.length;i < l;i++){
                this.children[i].parent = this;
                d.append(ul,this.children[i].wrapper);
            }
            this.wrapper.appendChild(ul);
        }
        //执行这句话的意义在于当重新设置children的时候能够根据新的children来判断当前menuitem是否需要打开
        let hasOpen = this.isOpen;
        this.isOpen = hasOpen;
        //如果是第二次对children赋值则需要根据tree节点的属性 重新设置该treeItem符合tree的属性
        if(!isFirst){
            let root = TreeItem.treeItemUtil.getRoot(this);
            let isCheckBox = root.isCheckBox,theme = root.theme;
            root.isCheckBox = isCheckBox;
            root.theme = theme;
        }
    }
    get children() {
        return this._children;
    }

    set isSelected(isSelected: boolean) {
        this._isSelected = tools.valid.isEmpty(isSelected) ? false : isSelected;
        let tempCheck = <HTMLInputElement>d.query('.treeCheck',this.wrapper);//获取当前节点是否存在checkBox
        let itemWrapper = d.query('.itemWrapper',this.wrapper);
        if (this._isSelected) {
                itemWrapper.classList.add('itemSelected');
                tempCheck && (tempCheck.checked = true);
        } else {
            itemWrapper.classList.remove('itemSelected');
            tempCheck && (tempCheck.checked = false);
        }
    }
    get isSelected() {
        return this._isSelected;
    }

    set isOpen(isOpen: boolean) {
        this._isOpen = tools.valid.isEmpty(isOpen) ? false : isOpen;
        let liWrapper = d.query('.liWrapper',this.wrapper);
        if(liWrapper){
            liWrapper.classList.remove(this.isOpen ? 'hideTree' : 'showTree');
            liWrapper.classList.add(this.isOpen ? 'showTree' : 'hideTree');
        }
        //重新设置isOpen之后重新设置收缩或者展开的图标状态
        let openIcon = d.query('.openIcon',this.wrapper);
        //如果存在打开或者收缩图标则更改当前图标的状态
        if(openIcon && this.children && this.children.length > 0){
            let root = TreeItem.treeItemUtil.getRoot(this);
            let openClass = root.theme === 'upDown' ? 'icon-zhankaishousuo-zhankai' : 'icon-jianhao1';
            let closeClass = root.theme === 'upDown' ? 'icon-zhankaishousuo-shousuo' : 'icon-jiahao1';
            openIcon.classList.remove(this.isOpen ?closeClass :openClass);
            openIcon.classList.add(this.isOpen ?openClass :closeClass);
        }
    }
    get isOpen() {
        return this._isOpen;
    }

    private _icon : string;
    set icon(icon : string){
        let hasSet = this.icon;
        this._icon = tools.valid.isEmpty(icon) ? null : icon;
        if(this.icon){
            if(!hasSet){
                let itemWrapper = d.query('.itemWrapper',this.wrapper);
                let i = d.createByHTML(`<i class = "iconfont ${this.icon} myIcon"><i>`);
                d.prepend(itemWrapper,i);
            }
            else{
                let myIcon = d.query('.myIcon',this.wrapper);
                myIcon.classList.remove(hasSet);
                myIcon.classList.add(this.icon);
            }
        }
    }
    get icon(){
        return this._icon;
    }

    private _color : string;
    set color(color : string){
        this._color = tools.valid.isEmpty(color) ? null : color;
        if(this.color){
            let itemWrapper = d.query('.itemWrapper',this.wrapper);
            itemWrapper.style.color = this.color;
        }
    }
    get color(){
        return this._color;
    }

    private initTreeItem(){
        let clickDom = d.query('.itemWrapper',this.wrapper);
        //为文本添加点击事件
        d.on(clickDom,'click',()=>{
            let tempCheck = <HTMLInputElement>d.query('.treeCheck',this.wrapper);//获取当前节点是否存在checkBox
            //如果存在checkBox,则模拟点击checkBox 在checkBox点击事件中执行了this.isSelected = !this.isSelected;   否则切换选中状态
            tempCheck ? tempCheck.click() : (this.isSelected = !this.isSelected);
            //如果父元素是单选状态则先取消同级节点其它选中状态
            if(this.parent.selection === 'single'){
                let parChild = this.parent.children;
                if(parChild && parChild.length > 0){
                    for(let i = 0,l = parChild.length;i < l;i++){
                        if(parChild[i] !== this){ //如果不等于自己则关闭
                            parChild[i].isSelected = false;
                        }
                    }
                }
            }
            if(this.isSelected){
                this.onSelected(this,()=>{});
            }
        });
        let line = d.createByHTML('<span class="line"></span> ');
        d.prepend(this.wrapper,line);
    }

    static treeItemUtil = (function(){
        let getRoot = function(item){
            if(item.parent){
                return getRoot(item.parent);
            }
            else{
                return item;
            }
        };
        return {getRoot}
    })()
}