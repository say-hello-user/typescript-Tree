/// <amd-module name="Tree"/>
import d = G.d;
import tools = G.tools;
import {INode, Node} from "../../navigation/node/Node";
import {TreeItem} from "./TreeItem";
interface ITree extends INode{
    isCheckBox? : boolean; //是否显示checkBox
    theme? : string;//主题
}
/**
 * 树形组件对象
 */
export class Tree extends Node{
    constructor(private treePara: ITree) {
        super(treePara);
        this._wrapper = d.createByHTML(`<ul class="tree"></ul>`);

        this.children = treePara.children;
        this.container = treePara.container;

        this.isCheckBox = treePara.isCheckBox;
        this.theme = treePara.theme;
        this.container.appendChild(this._wrapper);
    }

    set children(children: Array<TreeItem>) {
        //如果已经设置过children则重新设置children的值
        if(this.children){
            //首先在页面中清除该子节点
            for(let i = 0;i < this.wrapper.childNodes.length;i++){
                let childTemp = <HTMLElement>this.wrapper.childNodes[i];
                if(childTemp.classList.contains('nodeList')){
                    this.wrapper.removeChild(childTemp);
                    i = i-1;
                }
            }
        }
        this._children = children;
        for(let i = 0;i < children.length;i++){
            children[i].parent = this;
            this.wrapper.appendChild(children[i].wrapper);
        }
    }
    get children() {
        return this._children;
    }

    /**
     * 设置tree是否添加选择框 默认 是
     */
    private _isCheckBox : boolean;
    set isCheckBox(isCheckBox : boolean){
        this._isCheckBox = tools.valid.isEmpty(isCheckBox) ? false : isCheckBox;
        let checkAction = this.isCheckBox ? Tree.treeUtil.addCheckBox : Tree.treeUtil.deleteCheckBox;
        for(let i = 0;i < this.children.length;i++){
            checkAction(this.children[i]);
        }
    }
    get isCheckBox(){
        return this._isCheckBox;
    }

    /**
     * 设置tree主题 upDown(上下箭头) addMinus(加减号)
     * 默认值 upDown
     */
    private _theme : string;
    set theme(theme : string){
        this._theme = tools.valid.isEmpty(theme) ? 'upDown' : theme;
        let openClass = this._theme === 'upDown' ? 'icon-zhankaishousuo-zhankai' : 'icon-jianhao1';
        let closeClass = this._theme === 'upDown' ? 'icon-zhankaishousuo-shousuo' : 'icon-jiahao1';
        for(let i = 0;i < this.children.length;i++){
            Tree.treeUtil.addOpenIcon(this.children[i],openClass,closeClass);
        }
    }
    get theme(){
        return this._theme;
    }

    static treeUtil = (function(){
        let addOpenIcon = function(treeItem,openClass,closeClass){
            //若当前wrapper没有打开图标的时候  则生成该图标
            if(!d.query('.openIcon',treeItem.wrapper)){
                //创建一个打开 关闭树节点
                let openIcon = <HTMLInputElement>d.createByHTML('<i class="iconfont openIcon"></i>');
                //根据配置的isOpen设置为当前节点添加打开或者关闭的icon
                openIcon.classList.add(treeItem.isOpen ? openClass : closeClass);
                openIcon.onclick = (e)=>{
                    let afterOpen = ()=>{
                            openIcon.className = openIconClass;
                            if(treeItem.children && treeItem.children.length>0){
                                openIcon.classList.remove(treeItem.isOpen ? closeClass : openClass);
                                openIcon.classList.add(treeItem.isOpen ? openClass : closeClass);
                            }
                            else{
                                openIcon.classList.remove(closeClass);
                                treeItem.wrapper.style.marginLeft = '16px';
                            }
                            //若当前节点没有子节点则无论怎么点击 当前节点的isOpen属性始终为false
                            if(treeItem.children && treeItem.children.length === 0){
                                treeItem.isOpen = false;
                            }
                        //添加打开关闭动画
                        let liWrapper = d.query('.liWrapper',treeItem.wrapper);
                        if(liWrapper){
                            let animateEnd = ()=>{
                                liWrapper.removeAttribute('style')
                            };
                            liWrapper.addEventListener("webkitTransitionEnd",animateEnd);
                            liWrapper.addEventListener("transitionend",animateEnd);

                            if(treeItem.isOpen){
                                let preHeight = liWrapper.offsetHeight;
                                liWrapper.style.height = '0px';
                                setTimeout(()=>{
                                    liWrapper.style.height = preHeight + 'px';
                                },0);
                            }
                            else{
                                liWrapper.setAttribute('style','display:block');
                                let preHeight = liWrapper.offsetHeight;
                                liWrapper.style.height = preHeight + 'px';
                                setTimeout(()=>{
                                    liWrapper.style.height =  '0px';
                                },0);
                            }
                        }
                    };
                    treeItem.isOpen = !treeItem.isOpen;
                    //将当前icon替换为加载状态的icon
                    let openIconClass = openIcon.className;
                    if(treeItem.children && treeItem.children.length === 0){
                        openIcon.className = 'iconfont icon-shuaxin rotateIcon openIcon';
                    }
                    //如果父元素是手风琴则先关闭同级treeItem
                    if(treeItem.parent.isAccordion){
                        let parChild = treeItem.parent.children;
                        if(parChild && parChild.length > 0){
                            for(let i = 0,l = parChild.length;i < l;i++){
                                if(parChild[i] !== treeItem){ //如果不等于自己则关闭
                                    parChild[i].isOpen = false;
                                }
                            }
                        }
                    }
                    //如果是展开状态并且传了onOpen函数  则调用onOpen函数  并且传入渲染后需要调用的函数  否则直接调用打开之后需要调用的函数
                    treeItem.isOpen && treeItem.onOpen ? treeItem.onOpen(treeItem,afterOpen) : afterOpen();//当打开的时候执行打开回调函数
                };
                //将新生成的icon放进wrapper
                d.prepend(treeItem.wrapper,openIcon);
            }
            for(let i=0,l=treeItem.children.length;i<l;i++){
                addOpenIcon(treeItem.children[i],openClass,closeClass);
            }
        };
        //添加checkBox
        let addCheckBox = function(treeItem){
            if(!d.query('.select-box',treeItem.wrapper)){
                //创建checkbox元素
                let checkBox = <HTMLInputElement>d.createByHTML('<input type="checkbox" class="treeCheck" name="treeCheck" value=""/>');
                let checkSpan = d.createByHTML('<span class="check-span label-checkbox"></span>');
                let div = d.createByHTML('<div class="select-box"></div>');
                d.append(div,checkBox);d.append(div,checkSpan);d.prepend(treeItem.wrapper,div);
                div.onclick = (e)=>{
                    treeItem.isSelected  = !treeItem.isSelected;
                    checkBefore(treeItem);
                    checkAfter(treeItem);
                };
                //如果在参数中设置了isSelected则递归检查父节点以及子节点的check状态
                if(treeItem.isSelected){
                    checkBox.checked = true;
                    checkBefore(treeItem);
                    checkAfter(treeItem);
                }
            }
            if(treeItem.children && treeItem.children.length>0){
                for(let i=0,l=treeItem.children.length;i<l;i++){
                    addCheckBox(treeItem.children[i]);
                }
            }
        };
        //删除checkBox
        let deleteCheckBox = function(treeItem){
            let checkBox = d.query('.select-box',treeItem.wrapper);
            checkBox && d.remove(checkBox);
            if(treeItem.children && treeItem.children.length>0){
                for(let i=0,l=treeItem.children.length;i<l;i++){
                    deleteCheckBox(treeItem.children[i]);
                }
            }
        };
        //递归检查check下方的check状态
        let checkAfter = function(item){
            let isChecked = item.isSelected;
            if(item.children && item.children.length > 0){
                for(let i = 0,l = item.children.length;i < l;i++){
                    item.children[i].isSelected = isChecked;
                    checkAfter(item.children[i]);
                }
            }
        };
        //递归检查check上方的check状态
        let checkBefore = function(item){
            //判断是否有父元素，有父元素则需要继续判断父元素的check状态
            if(item.parent){
                let hasCheck = false;
                for(let i = 0,l =item.parent.children.length;i < l;i++){
                    if(item.parent.children[i].isSelected){
                        hasCheck = true;
                    }
                }
                hasCheck ? (item.parent.isSelected = true) : (item.parent.isSelected = false);
                if(item.parent.parent){
                    checkBefore(item.parent);
                }
            }
        };
        return {
            addCheckBox,addOpenIcon,deleteCheckBox
        }
    })()
}