import styles from "./Tasks.module.css";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import axios from "axios";
import { FaPlus } from "react-icons/fa";
import { FaPen } from "react-icons/fa";
import { FaRegTrashAlt } from "react-icons/fa";
import { FaCheckCircle } from "react-icons/fa";
import { FaRobot } from "react-icons/fa";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FaTag } from "react-icons/fa";
import React, { useState } from "react";

const Tasks = ({
  activeTaskId,
  setActiveTaskId,
  tasks,
  setTasks,
  onTaskCompleted,
}) => {
  const [newTask, setNewTask] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [loadingTasks, setLoadingTasks] = useState(new Set());
  const [categorizingTasks, setCategorizingTasks] = useState(new Set());
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editedCategory, setEditedCategory] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL || "https://pomotask-back.eu-north-1.elasticbeanstalk.com";

  const labelMappings = {
    tm: "Time needed",
    bt: "Best time",
    pre: "Prerequisites",
    nrg: "Energy level",
    rem: "Reminder",
    loc: "Location",
    tl: "Tools",
  };
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleAddClick = () => {
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const updatedTask = tasks.filter((task) => task.id !== id);
    setTasks(updatedTask);

    // clean up expanded state
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
  };

  const handleEdit = (id, currentTitle) => {
    setEditTaskId(id);
    setEditedTitle(currentTitle);
  };

  const handleToggleStatus = (id) => {
    const task = tasks.find((t) => t.id === id);
    const wasPending = task.status === "pending";

    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? { ...task, status: task.status === "done" ? "pending" : "done" }
        : task
    );
    setTasks(updatedTasks);

    // Trigger toast if task was completed (pending -> done)
    if (wasPending && onTaskCompleted) {
      onTaskCompleted(task.title);
    }
  };

  const handleSaveEdit = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, title: editedTitle } : task
    );
    setTasks(updatedTasks);
    setEditTaskId(null);
    setEditedTitle("");
  };

  const handleAISuggestions = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);

    // Toggle expansion state
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });

    // if AI suggestions already exist just toggle visibility
    if (task.aiSuggestions) {
      return;
    }

    // Fetch AI suggestions
    setLoadingTasks((prev) => new Set(prev).add(taskId));

    try {
      const response = await axios.get(
        `${apiUrl}/api/clarify?task=${encodeURIComponent(task.title)}`
      );

      if (response.data.success && response.data.description) {
        // Backend returns plain text description, but frontend expects structured JSON
        // For now, display the description as a simple text suggestion
        const aiSuggestions = {
          description: response.data.description
        };
        const updatedTasks = tasks.map((t) =>
          t.id === taskId ? { ...t, aiSuggestions } : t
        );
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      alert("Failed to get AI suggestions. Please try again.");

      // remove from expanded if error occurs
      setExpandedTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } finally {
      setLoadingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      title: newTask,
      status: "pending",
      sessions: 0,
      aiSuggestions: null,
      category: null,
    };

    setTasks([...tasks, task]);
    setNewTask("");
    setShowForm(false);
  };
function extractJSONFromDescription(desc) {
  if (!desc || typeof desc !== "string") return null;

  // strip Markdown formatting like ```json and ```
  const cleaned = desc.replace(/```json|```/gi, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

const handleCategorize = async (taskId) => {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  setCategorizingTasks((prev) => new Set(prev).add(taskId));

  try {
    const response = await axios.get(
      `${apiUrl}/api/categorize?task=${encodeURIComponent(task.title)}`
    );

    if (response.data.success) {
      // Extract embedded JSON if required
      const descriptionData = extractJSONFromDescription(response.data.description);

      // merged result object (your requested structure)
      const parsed = {
        original_task: response.data.original_task,
        category:
          response.data.category || descriptionData?.category || "Uncategorized",
        confidence:
          response.data.confidence || descriptionData?.confidence || null,
        rationale:
          response.data.rationale || descriptionData?.rationale || null,
        alternatives: descriptionData?.alternatives ?? [],
      };

      console.log("Parsed category data:", parsed);

      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, category: parsed.category, metadata: parsed } : t
      );

      setTasks(updatedTasks);
    }
  } catch (error) {
    console.error("Error categorizing task:", error);
  } finally {
    setCategorizingTasks((prev) => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  }
};

  const handleEditCategory = (id, currentCategory) => {
    setEditingCategoryId(id);
    setEditedCategory(currentCategory || "");
  };

  const handleSaveCategory = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, category: editedCategory || null } : task
    );
    setTasks(updatedTasks);
    setEditingCategoryId(null);
    setEditedCategory("");
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", tasks[index].id.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = draggedIndex;
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(dragIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);
    setTasks(newTasks);
    setDraggedIndex(null);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2>Tasks</h2>
          </div>
          <button
            className={styles.addBtn}
            aria-label="Add task"
            title="Add task"
            onClick={handleAddClick}
          >
            <FaPlus />
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputContainer}>
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="What needs to be done?"
                className={styles.taskInput}
                maxLength="50"
                autoFocus
              />
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowForm(false);
                    setNewTask("");
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Add Task
                </button>
              </div>
            </div>
          </form>
        )}
        <div className={styles.tasks}>
          {tasks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <h3 className={styles.emptyTitle}>No tasks yet</h3>
              <p className={styles.emptyMessage}>
                Click the + button above to add your first task and start being
                productive!
              </p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <div key={task.id} className={styles.taskWrapper}>
                <div
                  className={styles.task}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className={styles.leftSide}>
                    {editTaskId === task.id ? (
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={() => handleSaveEdit(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveEdit(task.id);
                          } else if (e.key === "Escape") {
                            setEditTaskId(null);
                            setEditedTitle("");
                          }
                        }}
                        className={styles.editInput}
                        maxLength="50"
                        autoFocus
                      />
                    ) : (
                      <h3>{task.title}</h3>
                    )}

                    <div className={styles.taskInfo}>
                      <div className={styles.taskStatus}>{task.status}</div>
                      <div className={styles.taskSessions}>
                        {task.sessions} Sessions
                      </div>
                      {task.category && (
                        <div className={styles.taskCategory}>
                          {editingCategoryId === task.id ? (
                            <select
                              value={editedCategory}
                              onChange={(e) =>
                                setEditedCategory(e.target.value)
                              }
                              onBlur={() => handleSaveCategory(task.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveCategory(task.id);
                                } else if (e.key === "Escape") {
                                  setEditingCategoryId(null);
                                  setEditedCategory("");
                                }
                              }}
                              className={styles.categorySelect}
                              autoFocus
                            >
                              <option value="">No Category</option>
                              <option value="Work">Work</option>
                              <option value="Personal">Personal</option>
                              <option value="Study">Study</option>
                              <option value="Health">Health</option>
                              <option value="Finance">Finance</option>
                              <option value="Leisure">Leisure</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <span
                              onClick={() =>
                                handleEditCategory(task.id, task.category)
                              }
                            >
                              Category: {task.category}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.rightSide}>
                    <div className={styles.iconButtons}>
                      <span
                        onClick={() => handleAISuggestions(task.id)}
                        title="AI Suggestions"
                        className={styles.aiButton}
                      >
                        {expandedTasks.has(task.id) ? (
                          <FaChevronUp color="#8b5cf6" size={25} />
                        ) : (
                          <FaRobot color="#8b5cf6" size={25} />
                        )}
                      </span>

                      <span
                        onClick={() => handleCategorize(task.id)}
                        title="Categorize Task"
                        className={styles.aiButton}
                      >
                        {categorizingTasks.has(task.id) ? (
                          <div className={styles.loadingSpinner}>⟳</div>
                        ) : (
                          <FaTag color="#f59e0b" size={25} />
                        )}
                      </span>

                      <span onClick={() => handleToggleStatus(task.id)}>
                        <FaCheckCircle
                          color={task.status === "done" ? "#65a30d" : "#a3a3a3"}
                          size={25}
                        />
                      </span>

                      <span onClick={() => handleEdit(task.id, task.title)}>
                        <FaPen color="#2563eb" size={25} />
                      </span>

                      <span onClick={() => handleDelete(task.id)}>
                        <FaRegTrashAlt color="#dc2626" size={25} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI section */}
                {expandedTasks.has(task.id) && (
                  <div className={styles.aiSuggestionsSection}>
                    {loadingTasks.has(task.id) ? (
                      <div className={styles.loading}>Loading...</div>
                    ) : task.aiSuggestions ? (
                      <div className={styles.aiSuggestions}>
                        {Object.entries(task.aiSuggestions).map(
                          ([key, value]) => (
                            <div key={key} className={styles.suggestionItem}>
                              <span className={styles.suggestionLabel}>
                                {key === "description" ? "Description" : (labelMappings[key] || key)}:
                              </span>
                              <span className={styles.suggestionValue}>
                                {value}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                )}               
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tooltip instance */}
      <ReactTooltip id="crudBtns" place="bottom" />
    </>
  );
};

export default Tasks;
