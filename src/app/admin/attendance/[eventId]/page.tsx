
'use client';

import React, { useState, KeyboardEvent, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Download,
  Edit3,
  Power,
  PowerOff,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/utils';
import { attendanceAPI } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

interface Session {
  id: number;
  sessionName: string;
  location: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  present: number;
  absent: number;
  total: number;
  code?: string;
  credits: number;
}

const AttendanceManagement: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId;
  const { success, error, info } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]); // Start with no sessions
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [editingDate, setEditingDate] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSession, setNewSession] = useState({
    sessionName: '',
    location: '',
    startTime: '',
    endTime: '',
    isActive: true,
    credits: 0,
  });
  const [editSessionId, setEditSessionId] = useState<number | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!eventId) return;
      try {
        const res = await attendanceAPI.getEventSessions(Number(eventId));
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setSessions(
            res.data.data.map((s: any) => ({
              id: s.id,
              sessionName: s.sessionName,
              location: s.location,
              startTime: s.startTime,
              endTime: s.endTime,
              isActive: s.isActive,
              present: s.present, // Placeholder, update if you have stats
              absent: 0,  // Placeholder, update if you have stats
              total: 0,   // Placeholder, update if you have stats
              code: s.code, // Store code
              credits: s.credits || 0, // Include credits from API
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      }
    };
    fetchSessions();
  }, [eventId]);

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setEditSessionId(null);
    setNewSession({ sessionName: '', location: '', startTime: '', endTime: '', isActive: true, credits: 0 });
  };

  const handleOpenEditModal = (session: Session) => {
    setShowAddModal(true);
    setEditSessionId(session.id);
    setNewSession({
      sessionName: session.sessionName,
      location: session.location,
      startTime: session.startTime,
      endTime: session.endTime,
      isActive: session.isActive,
      credits: session.credits,
    });
  };

  const editSession = async (session: Session) => {
    try {
      const res = await attendanceAPI.updateSession(session.id, session);
    } catch (err) {
      console.log(err);
      console.log("edit failed")
    }
  }

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditSessionId(null);
    setNewSession({ sessionName: '', location: '', startTime: '', endTime: '', isActive: true, credits: 0 });
  };

  const handleNewSessionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewSession((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'credits' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) {
      error('Event Not Found', 'Event ID not found in URL.');
      return;
    }
    try {
      const payload = {
        sessionName: newSession.sessionName,
        location: newSession.location,
        startTime: new Date(newSession.startTime).toISOString(),
        endTime: new Date(newSession.endTime).toISOString(),
        isActive: newSession.isActive,
        credits: newSession.credits,
      };
      const response = await attendanceAPI.createSession(Number(eventId), payload);
      // Fix: correct data access structure (response.data.data contains the session)
      const createdSessionData = response.data.data;

      if (!createdSessionData) {
        throw new Error('No data received from create session API');
      }

      setSessions((prev) => [
        ...prev,
        {
          id: createdSessionData.id,
          sessionName: newSession.sessionName,
          location: newSession.location,
          startTime: newSession.startTime,
          endTime: newSession.endTime,
          isActive: createdSessionData.isActive,
          present: 0,
          absent: 0,
          total: 0,
          credits: newSession.credits,
          code: createdSessionData.code
        },
      ]);
    } catch (err) {
      console.log(err);
      error('Session Creation Failed', 'Failed to add session. Please try again.');
      return;
    }
    success('Session Added', 'The new attendance session has been created successfully.');
    handleCloseAddModal();
  };

  // New: Edit session function
  const handleEditSession = async (session: Session) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        sessionName: session.sessionName,
        location: session.location,
        startTime: new Date(session.startTime).toISOString(),
        endTime: session.endTime ? new Date(session.endTime).toISOString() : null,
        isActive: session.isActive,
        credits: Number(session.credits),
      };
      const res = await attendanceAPI.updateSession(session.id, payload);
      if (res.data && res.data.success) {
        setSessions((prevSessions) =>
          prevSessions.map((s) =>
            s.id === session.id ? { ...s, ...payload, endTime: payload.endTime || '' } : s
          )
        );
        success('Session Updated', 'Session details have been saved successfully.');
      } else {
        error('Update Failed', res.data?.message || 'Failed to update session.');
      }
    } catch (err) {
      console.error('Failed to update session:', err);
      error('Update Failed', 'Could not update session. Please try again.');
    }
  };

  const toggleSession = async (sessionId: number) => {
    console.log(sessionId)
    const sessionToToggle = sessions.find((s) => s.id === sessionId);
    if (!sessionToToggle) return;
    const newIsActive = !sessionToToggle.isActive;
    try {
      const token = localStorage.getItem('token');
      // Fix: Ensure dates are ISO strings and credits is number
      await attendanceAPI.updateSession(sessionId, {
        sessionName: sessionToToggle.sessionName,
        location: sessionToToggle.location,
        startTime: new Date(sessionToToggle.startTime).toISOString(),
        endTime: sessionToToggle.endTime ? new Date(sessionToToggle.endTime).toISOString() : null,
        isActive: newIsActive,
        credits: Number(sessionToToggle.credits)
      });
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === sessionId
            ? { ...session, isActive: newIsActive }
            : session
        )
      );
      info(
        newIsActive ? 'Session Activated' : 'Session Deactivated',
        newIsActive ? 'Students can now mark attendance.' : 'Attendance recording has been stopped.'
      );
    } catch (err) {
      console.error('Failed to update session status:', err);
      error('Status Update Failed', 'Failed to update session status. Please try again.');
    }
  };

  const updateSessionTitle = (sessionId: number, newTitle: string) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, sessionName: newTitle } : session
      )
    );
    setEditingSession(null);
  };

  const updateSessionDate = (sessionId: number, newDate: string) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, date: newDate } : session
      )
    );
    setEditingDate(null);
  };

  const deleteSession = (sessionId: number) => {
    // Remove restriction: allow deleting the last session
    const remainingSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(remainingSessions);

    if (activeSession === sessionId) {
      setActiveSession(remainingSessions[0]?.id ?? null);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const handleExport = async () => {
    try {
      const response = await attendanceAPI.exportEventSessions(Number(eventId));

      // Extract filename from Content-Disposition header if available
      let filename = `attendance_sessions_${eventId}.xlsx`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      success('Export Successful', 'Attendance data exported to Excel.');
    } catch (exportErr) {
      console.error('Error exporting sessions:', exportErr);
      error('Export Failed', 'Failed to export sessions. Please try again.');
    }
  };

  const handleUpdateSession = async (session: Session) => {
    try {
      const token = localStorage.getItem('token');
      const payload = { isActive: session.isActive };
      const res = await attendanceAPI.updateSession(session.id, payload);
      if (res.data && res.data.success) {
        setSessions((prevSessions) =>
          prevSessions.map((s) =>
            s.id === session.id ? { ...s, isActive: session.isActive } : s
          )
        );
      } else {
        error('Update Failed', res.data?.message || 'Failed to update session.');
      }
    } catch (err) {
      console.error('Failed to update session:', err);
      error('Update Failed', 'Could not update session. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button className="flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary)]" onClick={() => router.push('/admin/dashboard')}>
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Back to admin dashboard</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Attendance Management</h1>
          <div className="flex items-center justify-between mt-4">
            <p className="text-lg text-[var(--color-text-muted)]">Web Dev SIG</p>
            <div className="text-sm text-[var(--color-text-muted)]">3/15/2024 - 8/5/2024</div>
          </div>
        </div>

        {/* Session List */}
        <div className="bg-[var(--color-card)] rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Select Session</h2>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface-hover)]"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </button>
            </div>
          </div>
          {sessions.length === 0 ? (
            <div className="text-center text-[var(--color-text-muted)] py-12">
              <p className="mb-4">No sessions yet. Please create sessions from the 'Sessions' tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${activeSession === session.id
                    ? 'border-[var(--color-info)] bg-[var(--color-surface)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border)]'
                    }`}
                  onClick={() => setActiveSession(session.id)}
                >
                  <div className="flex items-center justify-end space-x-2 mb-3 pb-2 border-b border-[var(--color-border)]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(session);
                      }}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)]"
                      title="Edit Session"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSession(session);
                      }}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-green-600 hover:bg-green-50"
                      title="Update Session"
                    >
                      <span className="font-bold">Update</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSession(activeSession as number);
                      }}
                      className={`p-1.5 rounded-md ${session.isActive
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'
                        }`}
                      title={session.isActive ? 'Disable Session' : 'Enable Session'}
                    >
                      {session.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{session.sessionName}</span>
                  </div>
                  {/* Location */}
                  <div className="mb-3">
                    <span className="text-xs text-[var(--color-text-muted)]">{session.location}</span>
                  </div>
                  {/* Start/End Time */}
                  <div className="mb-3">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}
                    </span>
                  </div>
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${session.isActive ? 'bg-green-100 text-green-800' : 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                        }`}
                    >
                      {session.isActive ? 'Active' : 'Disabled'}
                    </span>
                    {activeSession === session.id && (
                      <div className="w-2 h-2 bg-[var(--color-button-primary)] rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Stats */}
        {sessions.length > 0 && activeSession !== null && (
          <div className="bg-[var(--color-card)] rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Attendance For {sessions.find((s) => s.id === activeSession)?.sessionName}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[var(--color-text-muted)]">Enable Attendance</span>
                  <button
                    onClick={() => toggleSession(activeSession)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sessions.find((s) => s.id === activeSession)?.isActive
                      ? 'bg-[var(--color-button-primary)]'
                      : 'bg-[var(--color-surface-hover)]'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-[var(--color-card)] transition-transform ${sessions.find((s) => s.id === activeSession)?.isActive
                        ? 'translate-x-6'
                        : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Show code if session is active */}
            {(() => {
              const session = sessions.find((s) => s.id === activeSession);
              if (session && session.isActive && session.code) {
                return (
                  <div className="my-8 flex justify-center">
                    <div className="text-5xl font-extrabold tracking-widest text-[var(--color-primary)] bg-[var(--color-surface)] px-8 py-6 rounded-lg shadow">
                      {session.code}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Present" color="green" value={sessions.find(s => s.id === activeSession)?.present ?? 0} />
              <StatCard label="Absent" color="red" value={sessions.find(s => s.id === activeSession)?.absent ?? 0} />
              <StatCard label="Total" color="blue" value={sessions.find(s => s.id === activeSession)?.total ?? 0} />
            </div>
          </div>
        )}
      </div>

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-card)] rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-muted)]"
              onClick={handleCloseAddModal}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4">{editSessionId !== null ? 'Edit Session' : 'Add New Session'}</h3>
            <form onSubmit={editSessionId !== null ? (e) => {
              e.preventDefault();
              const sessionToEdit = sessions.find(s => s.id === editSessionId);
              if (sessionToEdit) {
                handleEditSession({
                  ...sessionToEdit,
                  sessionName: newSession.sessionName,
                  location: newSession.location,
                  startTime: newSession.startTime,
                  endTime: newSession.endTime,
                  isActive: newSession.isActive,
                  credits: newSession.credits,
                });
              }
              handleCloseAddModal();
            } : handleAddSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Session Name</label>
                <input
                  type="text"
                  name="sessionName"
                  value={newSession.sessionName}
                  onChange={handleNewSessionChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  placeholder="Enter session name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newSession.location}
                  onChange={handleNewSessionChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  placeholder="Enter location (e.g. Hall A)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={newSession.startTime}
                  onChange={handleNewSessionChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  placeholder="Select start time"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={newSession.endTime}
                  onChange={handleNewSessionChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  placeholder="Select end time"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Credits</label>
                <input
                  type="number"
                  name="credits"
                  value={newSession.credits === 0 ? '' : newSession.credits}
                  onChange={handleNewSessionChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="0"
                  step="0.5"
                  placeholder="Enter credits"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={newSession.isActive}
                  onChange={handleNewSessionChange}
                  className="mr-2"
                />
                <label className="text-sm">Active</label>
              </div>
              <button
                type="submit"
                className="w-full bg-[var(--color-button-primary)] text-white py-2 rounded hover:bg-[var(--color-button-primary)]"
              >
                {editSessionId !== null ? 'Save Changes' : 'Add Session'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; color: string; value: number }> = ({
  label,
  color,
  value,
}) => {
  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-6 text-center`}>
      <div className={`text-3xl font-bold text-${color}-600 mb-2`}>{value}</div>
      <div className={`text-${color}-800 font-medium`}>{label}</div>
    </div>
  );
};

export default AttendanceManagement;
