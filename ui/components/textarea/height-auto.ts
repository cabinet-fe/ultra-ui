/**
 * 根据用户输入内容自适应高度
 * @param element 元素
 * @param moreHeight  初始化默认高度
 * @returns
 */

function heightAuto(element: HTMLElement, moreHeight: number) {
  let scrollHeight = element.scrollHeight
  if(scrollHeight > moreHeight){
    return scrollHeight
  }else{
    return moreHeight
  }
}

export default heightAuto
