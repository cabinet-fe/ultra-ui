const intList = new Set<HTMLElement>()

function addTip(el: HTMLElement) {
  intList.add(el)
  console.log("Current intList:", intList)
}

function delTip(el: HTMLElement) {
  intList.delete(el)
  console.log("Current intList:", intList)
}

function hasTips() {
  return intList.size > 0
}

export const intTipManager = {
  addTip,
  delTip,
  intList,
  hasTips
}
