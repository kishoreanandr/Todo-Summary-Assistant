import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8080';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`${API_BASE}/todos`);
      setTodos(res.data);
    } catch (err) {
      setMessage({ text: 'Error fetching todos', type: 'danger' });
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await axios.post(`${API_BASE}/todos`, { title: newTodo });
      setNewTodo('');
      await fetchTodos();
      setMessage({ text: 'Task added!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Error adding task', type: 'danger' });
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_BASE}/todos/${id}`);
      await fetchTodos();
      setMessage({ text: 'Task deleted', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Error deleting task', type: 'danger' });
    }
  };

  const sendSummary = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await axios.post(`${API_BASE}/summarize`);
      if (res.data.status === 'success') {
        setSummary(res.data.data);
        setMessage({ 
          text: `Summary sent to Slack! (Used ${res.data.data.tokensUsed} tokens)`,
          type: 'success'
        });
      } else {
        setMessage({ text: res.data.message || 'Error generating summary', type: 'danger' });
      }
    } catch (err) {
      setMessage({ text: 'Error connecting to server', type: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTodo = async (id, title) => {
    try {
      await axios.put(`${API_BASE}/todos/${id}`, { title });
      setEditingId(null);
      setEditingText('');
      await fetchTodos();
      setMessage({ text: 'Task updated!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Error updating task', type: 'danger' });
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div 
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ background: '#f9f9f9' }}
    >
      <div className="container p-5 shadow bg-white rounded" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 className="text-center mb-4">📝 Todo Summary Assistant</h1>

        {/* Add Task */}
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task"
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          />
          <button className="btn btn-primary" onClick={addTodo}>
            Add
          </button>
        </div>

        {/* Todo List */}
        <ul className="list-group mb-4">
          {todos.map((todo) => (
            <li key={todo.id} className="list-group-item d-flex justify-content-between align-items-center">
              {editingId === todo.id ? (
                <input
                  className="form-control me-2"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && updateTodo(todo.id, editingText)}
                />
              ) : (
                <span>{todo.title}</span>
              )}
              <div className="btn-group">
                {editingId === todo.id ? (
                  <button className="btn btn-sm btn-success" onClick={() => updateTodo(todo.id, editingText)}>✅</button>
                ) : (
                  <button className="btn btn-sm btn-secondary me-1" onClick={() => {
                    setEditingId(todo.id);
                    setEditingText(todo.title);
                  }}>
                    ✏️
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-danger" 
                  onClick={() => deleteTodo(todo.id)}
                  aria-label={`Delete ${todo.title}`}
                >
                  ❌
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary Button */}
        <div className="d-grid gap-2 mb-3">
          <button 
            className="btn btn-success" 
            onClick={sendSummary}
            disabled={isLoading || todos.length === 0}
          >
            {isLoading ? 'Sending...' : 'Summarize & Send to Slack'}
          </button>
        </div>

        {/* Summary Display */}
        {summary && (
          <div className="card mb-3">
            <div className="card-header">Generated Summary</div>
            <div className="card-body">
              {summary.summary.split('\n').map((line, i) => (
                <p key={i} className="card-text">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {message.text && (
          <div className={`alert alert-${message.type} mt-3`} role="alert">
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
