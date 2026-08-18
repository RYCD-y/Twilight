---
title: git快速食用指南
published: 2026-08-14
updated: 2026-08-14
pinned: false
description: 什么？你说你coding这么久了还不会git？
tags: [git, github, 入门]
category: 
    - 编程技巧
      - git
licenseName: "CC BY 4.0"
author: RYCD
draft: false
# cover: '/assets/images/Twilight.jpg'
copyProtection:
    blockSelection: false
    blockClipboard: false
    blockContextMenu: false
    blockDevTools: false
---

## git是什么，有什么功能  

- 代码存档与回档  
- 分支管理  
- 历史代码对比  
- 多人协作  
- 代码审查与历史追溯  
- 标签与发布  

git与现代IDE深度集成，不用git你的IDE就是不完整的   ~~你只用keil？彳亍~~  

同时，使用AI辅助coding和vibe coding时，AI也会调用git帮助查阅工程  
![AI_uses_Git](./AI_uses_Git.png)  

## 入门指南  

### 1. 安装git  

### 2. 基本概念

git仓库分为工作区和版本库。工作区即你的仓库中能看到的目录。工作区有一个隐藏目录 .git不算工作区，是 Git 的版本库，里面存了你的所有存档，版本库里还有一个文件很重要，叫作暂存区（也叫引索），这个暂存区存放了下一次需要提交的文件的目录，我们把这个引索中的文件叫作被追踪的文件，换句话说如果你不把文件添加到暂存区，那么下次提交这个文件就不会被存档。

![git_repository](./git_repository.png)

- git中将存档点称为提交
- HEAD是你所在分支的指针，分支会指向当前提交
- git的分支系统可以理解成一棵树上，主干是main分支，一般还有feature/xxx, release/xxx等，每个分支都有很多提交，我们自己可以任意管理分支，一般不在main分支上工作
- git使用提交哈希作为每个提交的标识，一般用短哈希(前七位)，可以在IDE的分支管理界面找到，也可以使用`git log --oneline --graph`查看

### 3. 常用命令

---

#### git init 初始化仓库

将当前目录初始化为git仓库

`git init`

> 今后的操作都要在git仓库中进行，要么是自己init，要么clone已有的仓库  

---

#### git clone 克隆仓库

从github拉取代码  

`git clone git@github.com:WUST-RM-Control/infantryman-4-2026.git`  

使用ssh从github拉取全向轮步兵整车代码到当前目录  

> clone可以选用https协议或ssh协议，不知道用什么就用ssh（）  
> 若出现`ssh: connect to host github.com port 22: Connection timed out`报错大概率网络问题，可以切换上网方法或者尝试使用https  

---

#### git add 从工作区添加到暂存区

`git add <相对路径：以当前目录为基>`

> 这里的路径可以使文件也可以是文件夹  
> 不知道什么是工作区的罚你去看基本概念  

从工作区添加 USART_Driver.c 到暂存区，使其下次提交时存入版本库

`git add Project/Commnuicate_Drivers/USART_Driver.c`

> 我们新建/更改的文件&文件夹不会自动添加到暂存区中，所以建议每次提交前都add一次  
> 一般我们git的工作路径（当前基路径）就是库根目录，所以我们可以使用`git add .`("."代表当前目录)直接将整个工程到暂存区，十分好用  

---

#### git commit 从暂存区提交到版本库

将当前暂存区保存的所有内容提交到版本库——**存档**

`git commit -m "添加了UART外设的驱动"`

> -m: message  
> `git commit`必须`-m " "`添加一条描述，否则不让提交  
> 不知道什么是暂存区的罚你去看基本概念  

---

#### git reset 回到过去的提交

回到提交哈希为`a1b2c3d`的提交

`git reset a1b2c3d`

:::caution
`git reset` 会让你的提交历史也回到旧的状态，导致无法看到那以后的提交，若还想再回到新提交只能使用 `git reflog` 查看完整的提交历史再 `git reset` 回去 ，同时也因此只适合还没push的本地提交，如果你已经push了，请使用`git revert` 撤销提交。
:::

---

#### git revert 撤销提交

撤销提交哈希为`a1b2c3d`的提交

`git revert a1b2c3d`

撤销上一次提交

`git revert HEAD`

:::note
撤销提交的原理是新建一个反向提交以抵消目标提交的作用，不会导致历史消失，因此更安全
:::

---

#### git branch 分支管理

>创建、重命名、查看、删除项目分支，通过 Git 做项目开发时，一般都是在开发分支中进行，开发完成后合并分支到主干，以保证main分支永远可用。  
>~~虽然但是，你main分支一柱擎天我也不会杀了你~~  

---

##### *查看分支*

通过不带参数的branch命令可以查看当前项目分支列表

`git branch`

---

##### 新建分支

创建一个名为 feature/UART 的开发分支，分支名只要不包括特殊字符即可。

`git branch feature/UART`

> 仅创建分支，并不会移动到新分支上，移动位置见switch  

---

##### 重命名分支

将 feature/UART 分支重命名为 feature/USART

`git branch -m feature/UART feature/USART`

> -m: move  
> 初始仓库默认主分支名字是master，建议改为main  

---

##### 删除分支

如果分支已经完成使命则可以通过 -d 参数将分支删除，这里为了继续下一步操作，暂不执行删除操作

`git branch -d feature/USART`

> -d: delete  

---

#### git switch 切换分支

`git switch feature/USART`

切换到UASRT分支

---

##### git merge 合并分支

`git merge feature/USART`

将feature/USART合并到当前所在分支，如果当前在main那么就是把feature/USART合并到main

> 合并前一定确定当前所在分支，使用git branch查看当前分支，或直接git switch [分支名]切换到被合并分支  
