"use client";

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play, 
  Pause, 
  Square,
  Target,
  GitBranch,
  Database,
  Settings,
  TrendingUp,
  FileText,
  Terminal
} from "lucide-react";
import { motion } from 'framer-motion';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  slices?: Slice[];
}

interface Slice {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  tasks?: Task[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
}

interface GSDStatus {
  milestone?: Milestone;
  health: {
    healthy: boolean;
    issues: string[];
  };
  settings: {
    planning_depth: string;
    context_mode_enabled: string;
    reactive_execution_enabled: string;
    auto_report: string;
    git_isolation: string;
  };
  isRunning: boolean;
  currentSession?: string;
}

const GSDDashboard: React.FC = () => {
  const [status, setStatus] = useState<GSDStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data with real CLI integration for buttons
  useEffect(() => {
    const loadStatus = async () => {
      try {
        setIsLoading(true);
        
        // Mock data for now - API routes not compiling
        const mockStatus: GSDStatus = {
          milestone: {
            id: 'M1778088173563',
            title: 'https://www.parakeet-ai.com/  https://www.chiku-ai.in/',
            description: 'visit these both websites or jitni jaada or necessary details la paao apni website attractive bnaane ke liye jaao laao and properly style kro koshish kro scroll krne waale transitions or motions USE kro jaada se jaada koi help chaahiye ho mere side se to bataana',
            status: 'active',
            created_at: new Date().toISOString(),
            slices: []
          },
          health: {
            healthy: true,
            issues: []
          },
          settings: {
            planning_depth: 'normal',
            context_mode_enabled: 'true',
            reactive_execution_enabled: 'true',
            auto_report: 'true',
            git_isolation: 'none'
          },
          isRunning: false,
          currentSession: undefined
        };
        
        setStatus(mockStatus);
      } catch (err) {
        setError('Failed to load GSD status');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
    
    // Set up real-time updates
    const interval = setInterval(loadStatus, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Handle button clicks with CLI integration
  const handleAction = async (action: 'start' | 'stop' | 'status' | 'doctor') => {
    try {
      // Show loading state
      const button = event?.target as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Executing...';
      }

      // Execute CLI command via fetch to a simple endpoint
      const response = await fetch('/api/gsd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      }).catch(() => {
        // If API fails, show user the CLI command to run manually
        const commands = {
          start: 'npm run gsd:auto',
          stop: 'npm run gsd:stop', 
          status: 'npm run gsd:status',
          doctor: 'npm run gsd:doctor'
        };
        
        alert(`API not ready. Please run this command manually:\n\n${commands[action]}\n\nThen refresh the page to see updates.`);
        
        if (button) {
          button.disabled = false;
          button.textContent = action === 'start' ? 'Start' : action === 'stop' ? 'Stop' : action === 'status' ? 'Status' : 'Doctor';
        }
        return;
      });

      if (response) {
        const result = await response.json();
        
        if (result.success) {
          alert(`Success: ${result.message}`);
          // Refresh status after action
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          alert(`Error: ${result.error}`);
        }
      }
    } catch (err) {
      alert('Failed to execute action. Please try running the command manually in terminal.');
      console.error(err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProgressPercentage = (slices?: Slice[]) => {
    if (!slices || slices.length === 0) return 0;
    const completed = slices.filter(s => s.status === 'completed').length;
    return Math.round((completed / slices.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error || 'No GSD status available'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GSD Auto Mode</h2>
          <p className="text-gray-600">Autonomous Development Execution Engine</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleAction(status.isRunning ? 'stop' : 'start')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              status.isRunning 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {status.isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start</span>
              </>
            )}
          </button>
          <button 
            onClick={() => handleAction('stop')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* Health Status */}
      <div className={`p-4 rounded-lg border ${
        status.health.healthy 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          <Activity className={`w-5 h-5 ${
            status.health.healthy ? 'text-green-600' : 'text-red-600'
          }`} />
          <span className={`font-medium ${
            status.health.healthy ? 'text-green-900' : 'text-red-900'
          }`}>
            System Health: {status.health.healthy ? 'Healthy' : 'Issues Detected'}
          </span>
        </div>
        {!status.health.healthy && status.health.issues.length > 0 && (
          <div className="mt-2 space-y-1">
            {status.health.issues.map((issue, index) => (
              <div key={index} className="text-sm text-red-700">• {issue}</div>
            ))}
          </div>
        )}
      </div>

      {/* Current Milestone */}
      {status.milestone && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Current Milestone</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
              status.milestone.status === 'active' 
                ? 'text-blue-600 bg-blue-50 border-blue-200'
                : status.milestone.status === 'completed'
                ? 'text-green-600 bg-green-50 border-green-200'
                : 'text-gray-600 bg-gray-50 border-gray-200'
            }`}>
              {status.milestone.status}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">{status.milestone.title}</h4>
              <p className="text-gray-600 text-sm">{status.milestone.description}</p>
            </div>
            
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{getProgressPercentage(status.milestone.slices)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage(status.milestone.slices)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slices Grid */}
      {status.milestone?.slices && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {status.milestone.slices.map((slice) => (
            <motion.div
              key={slice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(slice.status)}
                  <h4 className="font-medium text-gray-900">{slice.title}</h4>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(slice.status)}`}>
                  {slice.status}
                </span>
              </div>
              
              {slice.description && (
                <p className="text-sm text-gray-600 mb-3">{slice.description}</p>
              )}
              
              {slice.tasks && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 font-medium">Tasks:</div>
                  {slice.tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center space-x-2 text-xs">
                      {getStatusIcon(task.status)}
                      <span className="text-gray-700">{task.title}</span>
                    </div>
                  ))}
                  {slice.tasks.length > 3 && (
                    <div className="text-xs text-gray-500">+{slice.tasks.length - 3} more</div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Settings Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Configuration</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Database className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-medium">Planning</div>
            <div className="text-xs text-gray-600">{status.settings.planning_depth}</div>
          </div>
          <div className="text-center">
            <GitBranch className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-medium">Git Mode</div>
            <div className="text-xs text-gray-600">{status.settings.git_isolation}</div>
          </div>
          <div className="text-center">
            <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-sm font-medium">Context</div>
            <div className="text-xs text-gray-600">
              {status.settings.context_mode_enabled === 'true' ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          <div className="text-center">
            <FileText className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <div className="text-sm font-medium">Reports</div>
            <div className="text-xs text-gray-600">
              {status.settings.auto_report === 'true' ? 'Auto' : 'Manual'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Terminal className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            onClick={() => handleAction('status')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            View Detailed Status
          </button>
          <button 
            onClick={() => handleAction('doctor')}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
          >
            Generate Report
          </button>
          <button 
            onClick={() => window.open('https://localhost:3000', '_blank')}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
          >
            Open Terminal
          </button>
        </div>
      </div>
    </div>
  );
};

export default GSDDashboard;
