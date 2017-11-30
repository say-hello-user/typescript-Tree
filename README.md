# typescript-Tree
用typescript实现的一个树插件，使用方法简单，可实现动态加载

![image](https://github.com/say-hello-user/typescript-Tree/blob/master/img/para.png)

![image](https://github.com/say-hello-user/typescript-Tree/blob/master/img/show.png)

![image](https://github.com/say-hello-user/typescript-Tree/blob/master/img/load.png)
<br>
可实现属性动态更改
<br>
若有不懂使用请私信我

### 使用实例

```javascript
 let child0 = new TreeItem({
            content : 'child0',
            icon : 'icon-device-mb'
        })

        let child1 = new TreeItem({
            content : 'child1',
            icon : 'icon-device-mb',
            onOpen: (item,afterCb)=>{
                if(child1.children.length === 0) {
                    setTimeout(() => {
                        child1.addItem(child0);
                        afterCb();
                    }, 1000)
                }
            }
        })
        let child2 = new TreeItem({
            content : 'child2',
            icon : 'icon-device-mb'
        })
        let child3 = new TreeItem({
            content : 'child3',
            icon : 'icon-device-mb'
        })
        let child4 = new TreeItem({
            content : 'child4',
            icon : 'icon-device-mb'
        })

        let child5 = new TreeItem({
            content : 'child5',
            icon : 'icon-device-mb',
            onOpen : (item,afterCb)=>{
                if(child5.children.length === 0){
                    setTimeout(()=>{
                        child5.children = [child4];
                        afterCb();
                    },1000)
                }

            },
            onSelected:(item)=>{
                console.log(item);
            }
        })
        let child6 = new TreeItem({
            content : 'child6',
            icon : 'icon-device-mb',
            children : [child1,child3]
        })
        let child7 = new TreeItem({
            content : 'child7',
            icon : 'icon-device-mb'
        })

        let child111 = new TreeItem({
            content : 'child111',
            icon : 'icon-device-mb'
        })

        let item1 = new TreeItem({
            content : 'item1',
            icon : 'icon-device-mb',
            children : [child5,child6,child111]
        })

        let item2 =  new TreeItem({
            content : 'item2',
            icon : 'icon-device-mb',
           children : [child7]
        })

        let tree = new Tree({
            content : null,
            container : this.container,
            isCheckBox : true,
            children : [item1,item2],
            selection : 'multi'
        })
        child4.children = [child2]
        child6.isOpen = true
        child6.icon = 'icon-saleman'
```
