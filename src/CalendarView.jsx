import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const localizer = momentLocalizer(moment);

function CalendarView() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('https://task-scheduler-7fe4.onrender.com/tasks')
      .then((response) => setTasks(response.data))
      .catch((error) => {
        console.error('Error fetching tasks:', error);
        setError('Failed to fetch tasks. Please try again.');
      });
  }, []);

  return (
    <div className="App">
      <header className="app-header">
        <h1>Calendar View</h1>
      </header>
      <Link to="/" className="calendar-link">Back to Task List</Link>
      {error && <p className="error-message">{error}</p>}
      <Calendar
        localizer={localizer}
        events={tasks
          .filter((task) => task.dueDate)
          .map((task) => ({
            title: `${task.text} [${task.priority}]`,
            start: new Date(task.dueDate),
            end: new Date(task.dueDate),
            id: task._id,
          }))}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500, marginTop: 20 }}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.priority === 'High' ? '#FF6384' : event.priority === 'Medium' ? '#36A2EB' : '#FFCE56',
          },
        })}
      />
    </div>
  );
}

export default CalendarView;