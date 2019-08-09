import { Notion, Nast } from '../../../types/src'

import { getBlockColor, getBlockTitle } from './utils'

async function transformToDo(
  node: Notion.BlockValue
): Promise<Nast.ToDoList> {
  let nastNode = {
    id: node.id,
    type: 'to_do' as 'to_do',
    color: getBlockColor(node),
    createdTime: node.created_time,
    lastEditedTime: node.last_edited_time,
    children: [],
    text: getBlockTitle(node),
    checked: node.properties
      ? node.properties.checked
        ? node.properties.checked[0][0] === 'Yes'
        : false
      : false
  }
  return nastNode
}

export default transformToDo