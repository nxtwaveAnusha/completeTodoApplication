const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null
const intializeDBAndSever = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('sever is running....')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
intializeDBAndSever()

const searchQueries = async (request, response, next) => {
  const {search_q = '', category, priority, status, date} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArr = ['WORK', 'HOME', 'LEARNING']
    const iscategoryContain = categoryArr.includes(category)
    if (iscategoryContain === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  }

  if (priority !== undefined) {
    const priorityArr = ['HIGH', 'MEDIUM', 'LOW']
    const ispriorityContain = priorityArr.includes(priority)
    if (ispriorityContain === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  }
  if (status !== undefined) {
    const statusArr = ['TO DO', 'IN PROGRESS', 'DONE']
    const isstatusContain = statusArr.includes(status)
    if (isstatusContain === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  }
  if (date !== undefined) {
    try {
      const myDate = new Date(date)
      const formatDate = format(new Date(date), 'yyyy-MM-dd')
      const rst = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      const isValidDate = await isValid(rst)
      if (isValidDate === true) {
        request.date = formatDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todoId = todoId
  request.search_q = search_q

  next()
}

const todoBody = async (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArr = ['WORK', 'HOME', 'LEARNING']
    const iscategoryContain = categoryArr.includes(category)
    if (iscategoryContain === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  }
  if (priority !== undefined) {
    const priorityArr = ['HIGH', 'MEDIUM', 'LOW']
    const ispriorityContain = priorityArr.includes(priority)
    if (ispriorityContain === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  }
  if (status !== undefined) {
    const statusArr = ['TO DO', 'IN PROGRESS', 'DONE']
    const isstatusContain = statusArr.includes(status)
    if (isstatusContain === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  }
  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formatDate = format(new Date(dueDate), 'yyyy-MM-dd')
      const rsut = toDate(new Date(formatDate))
      const isValidDate = isValid(rsut)
      if (isValidDate === true) {
        request.dueDate = formatDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todo = todo
  request.id = id

  request.todoId = todoId
  next()
}

app.get('/todos/', searchQueries, async (request, response) => {
  const {
    search_q = '',
    priority = '',
    status = '',
    category = '',
  } = request.query

  const getTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' AND category LIKE '%${category}%' AND status LIKE '%${status}%';`
  const todoArr = await db.all(getTodoQuery)
  response.send(todoArr)
})
app.get('/todos/:todoId/', searchQueries, async (request, response) => {
  const {todoId} = request.params
  const getOneTodoQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE id = ${todoId};`
  const doArr = await db.get(getOneTodoQuery)
  response.send(doArr)
})
app.get('/agenda/', searchQueries, async (request, response) => {
  const {date} = request
  const getDateQuery = `SELECT id,todo,priority,status,category,due_date as dueDate FROM todo WHERE due_date = '${date}';`
  const dateArr = await db.all(getDateQuery)

  if (dateArr === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(dateArr)
  }
})

app.post('/todos/', todoBody, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const insertTodo = `INSERT INTO todo (id, todo, priority, status,category,due_date)
  VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`
  await db.run(insertTodo)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', todoBody, async (request, response) => {
  const {todoId} = request.params
  const {todo, priority, status, category, dueDate} = request.body

  let updatedQuery = ''
  switch (true) {
    case status !== undefined:
      updatedQuery = `UPDATE todo SET  status = '${status}' WHERE  id = ${todoId};`
      await db.run(updatedQuery)
      response.send('Status Updated')
      break

    case priority !== undefined:
      updatedQuery = `UPDATE todo SET  priority = '${priority}' WHERE  id = ${todoId};`
      await db.run(updatedQuery)
      response.send('Priority Updated')
      break
    case category !== undefined:
      updatedQuery = `UPDATE todo SET  category = '${category}' WHERE  id = ${todoId};`
      await db.run(updatedQuery)
      response.send('Category Updated')
      break
    case todo !== undefined:
      updatedQuery = `UPDATE todo SET  todo = '${todo}' WHERE  id = ${todoId};`
      await db.run(updatedQuery)
      response.send('Todo Updated')
      break
    case dueDate !== undefined:
      updatedQuery = `UPDATE todo SET  due_date = '${dueDate}' WHERE  id = ${todoId};`
      await db.run(updatedQuery)
      response.send('Due Date Updated')
      break
  }
})

app.delete('/todos/:todoId/', todoBody, async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`

  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})
module.exports = app
