import { useState, useEffect } from 'react';
import { format, isBefore, addDays } from 'date-fns';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [error, setError] = useState('');
  const [editTask, setEditTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [remindedTasks, setRemindedTasks] = useState(new Set());

  useEffect(() => {
    axios.get('http://localhost:5000/tasks')
      .then((response) => setTasks(response.data))
      .catch((error) => {
        console.error('Error fetching tasks:', error);
        setError('Failed to fetch tasks. Please try again.');
      });

    // Check for due date alerts (once per task)
    const now = new Date();
    tasks.forEach((task) => {
      if (!task.completed && task.dueDate && isBefore(new Date(task.dueDate), addDays(now, 1)) && !remindedTasks.has(task._id)) {
        alert(`Reminder: "${task.text}" is due tomorrow (${format(new Date(task.dueDate), 'PP')})!`);
        setRemindedTasks((prev) => new Set(prev).add(task._id));
      }
    });
  }, [tasks, remindedTasks]);

  const addTask = () => {
    if (newTask.trim()) {
      axios.post('http://localhost:5000/tasks', {
        text: newTask,
        completed: false,
        dueDate: newDueDate,
        priority: newPriority,
      })
        .then((response) => {
          setTasks([...tasks, response.data]);
          setNewTask('');
          setNewDueDate('');
          setNewPriority('Medium');
          setError('');
        })
        .catch((error) => {
          console.error('Error adding task:', error);
          setError('Failed to add task. Please try again.');
        });
    }
  };

  const toggleTask = (id) => {
    const task = tasks.find((t) => t._id === id);
    axios.put(`http://localhost:5000/tasks/${id}`, {
      ...task,
      completed: !task.completed,
    })
      .then((response) => {
        setTasks(tasks.map((t) => (t._id === id ? response.data : t)));
        setError('');
      })
      .catch((error) => {
        console.error('Error updating task:', error);
        setError('Failed to update task. Please try again.');
      });
  };

  const deleteTask = (id) => {
    axios.delete(`http://localhost:5000/tasks/${id}`)
      .then(() => {
        setTasks(tasks.filter((t) => t._id !== id));
        setError('');
      })
      .catch((error) => {
        console.error('Error deleting task:', error);
        setError('Failed to delete task. Please try again.');
      });
  };

  const startEditing = (task) => {
    setEditTask(task._id);
    setEditText(task.text);
    setEditDueDate(task.dueDate || '');
    setEditPriority(task.priority);
  };

  const saveEdit = (id) => {
    axios.put(`http://localhost:5000/tasks/${id}`, {
      text: editText,
      dueDate: editDueDate,
      priority: editPriority,
      completed: tasks.find((t) => t._id === id).completed,
    })
      .then((response) => {
        setTasks(tasks.map((t) => (t._id === id ? response.data : t)));
        setEditTask(null);
        setError('');
      })
      .catch((error) => {
        console.error('Error updating task:', error);
        setError('Failed to update task. Please try again.');
      });
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority] || new Date(a.dueDate) - new Date(b.dueDate);
  });
  const upcomingTasks = sortedTasks.filter((task) => !task.completed && new Date(task.dueDate) >= new Date());
  const completedTasks = sortedTasks.filter((task) => task.completed);

  return (
    <div className="App">
      <header className="app-header">
        <h1>Task Scheduler</h1>
      </header>
      <div className="task-form">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task"
          className="task-input"
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="date-input"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          className="priority-select"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button onClick={addTask} className="add-button">Add Task</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      <Link to="/calendar" className="calendar-link">View Calendar</Link>
      <div className="task-sections">
        <div className="task-section">
          <h2>Upcoming Tasks</h2>
          <div className="task-header">
            <span>Task</span>
            <span>Task Priority</span>
            <span>Deadline</span>
            <span>Actions</span>
          </div>
          <ul className="task-list">
            {upcomingTasks.map((task) => (
              <li key={task._id} className="task-item">
                {editTask === task._id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-input"
                    />
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="edit-date"
                    />
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="edit-select"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <button onClick={() => saveEdit(task._id)} className="action-button save-button">Save</button>
                    <button onClick={() => setEditTask(null)} className="action-button cancel-button">Cancel</button>
                  </div>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task._id)}
                      className="task-checkbox"
                    />
                    <span className={task.completed ? 'completed' : ''}>
                      {task.text}
                    </span>
                    <span className="task-priority">{task.priority}</span>
                    <span className="task-deadline">
                      {task.dueDate && `${format(new Date(task.dueDate), 'PP')}`}
                    </span>
                    <div className="task-actions">
                      <button onClick={() => startEditing(task)} className="action-button edit-button">Edit</button>
                      <button onClick={() => deleteTask(task._id)} className="action-button delete-button">Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          <h2>Completed Tasks</h2>
          <div className="task-header">
            <span>Task</span>
            <span>Task Priority</span>
            <span>Deadline</span>
            <span>Actions</span>
          </div>
          <ul className="task-list">
            {completedTasks.map((task) => (
              <li key={task._id} className="task-item">
                {editTask === task._id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-input"
                    />
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="edit-date"
                    />
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="edit-select"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <button onClick={() => saveEdit(task._id)} className="action-button save-button">Save</button>
                    <button onClick={() => setEditTask(null)} className="action-button cancel-button">Cancel</button>
                  </div>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task._id)}
                      className="task-checkbox"
                    />
                    <span className={task.completed ? 'completed' : ''}>
                      {task.text}
                    </span>
                    <span className="task-priority">{task.priority}</span>
                    <span className="task-deadline">
                      {task.dueDate && `${format(new Date(task.dueDate), 'PP')}`}
                    </span>
                    <div className="task-actions">
                      <button onClick={() => startEditing(task)} className="action-button edit-button">Edit</button>
                      <button onClick={() => deleteTask(task._id)} className="action-button delete-button">Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;