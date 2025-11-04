import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface DashboardData {
  student: {
    id: string;
    fullName: string;
    matricNumber: string;
    department: string;
    level: number;
  };
  results: Array<{
    id: string;
    course_code: string;
    course_title: string;
    grade: string;
    credit_units: number;
    semester: string;
    blockchainVerified: boolean;
  }>;
  totalRecords: number;
}

interface Result {
  id: string;
  course_code: string;
  course_title: string;
  grade: string;
  credit_units: number;
  semester: string;
  academic_session: string;
  ipfs_hash: string;
  blockchain_tx_hash?: string;
  student_id?: string;
}

// Dashboard Component
const Dashboard: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboard();
    }
  }, [isAuthenticated, token]);

  const fetchDashboard = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get<DashboardData>(`${API_URL}/students/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Full Name</p>
            <p className="text-lg font-semibold">{dashboardData.student.fullName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Matric Number</p>
            <p className="text-lg font-semibold">{dashboardData.student.matricNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Department</p>
            <p className="text-lg font-semibold">{dashboardData.student.department}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-lg font-semibold">{dashboardData.student.level}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Academic Records ({dashboardData.totalRecords})
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Course Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Course Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Credit Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.results.map((result) => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.course_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.course_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.credit_units}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.semester}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.blockchainVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Results Component
const Results: React.FC = () => {
  const { token } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get<{ results: Result[] }>(`${API_URL}/students/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(response.data.results || []);
    } catch (error: any) {
      console.error('Results fetch error:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const downloadTranscript = async (result: Result): Promise<void> => {
    try {
      // Generate PDF transcript
      const doc = new jsPDF();
      doc.text('Academic Transcript', 20, 20);
      doc.text(`Course: ${result.course_code} - ${result.course_title}`, 20, 30);
      doc.text(`Grade: ${result.grade}`, 20, 40);
      doc.text(`Credit Units: ${result.credit_units}`, 20, 50);
      doc.text(`Semester: ${result.semester}`, 20, 60);
      doc.text(`Academic Session: ${result.academic_session}`, 20, 70);
      doc.text(`IPFS Hash: ${result.ipfs_hash}`, 20, 80);
      if (result.blockchain_tx_hash) {
        doc.text(`Blockchain TX: ${result.blockchain_tx_hash}`, 20, 90);
      }

      doc.save(`transcript-${result.course_code}-${Date.now()}.pdf`);
      toast.success('Transcript downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download transcript');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Academic Results</h2>
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {result.course_code} - {result.course_title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Grade: {result.grade} | Credit Units: {result.credit_units} | Semester: {result.semester}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Academic Session: {result.academic_session}
                  </p>
                  {result.blockchain_tx_hash && (
                    <p className="text-xs text-gray-500 mt-1">
                      TX Hash: {result.blockchain_tx_hash.substring(0, 20)}...
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadTranscript(result)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download PDF
                  </button>
                  <Link
                    to={`/student/qr/${result.id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View QR Code
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// QR Code Component
const QRCodeView: React.FC = () => {
  const { token } = useAuth();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      fetchResult();
    }
  }, [id]);

  const fetchResult = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get<Result>(`${API_URL}/students/records/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(response.data);
    } catch (error: any) {
      console.error('Result fetch error:', error);
      toast.error('Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Result not found</p>
      </div>
    );
  }

  // Generate QR code data
  const qrData = JSON.stringify({
    studentId: result.student_id,
    recordHash: result.ipfs_hash,
    verificationUrl: `${window.location.origin}/verify?studentId=${result.student_id}&hash=${result.ipfs_hash}`,
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">QR Code Verification</h2>
      <div className="flex flex-col items-center space-y-4">
        <QRCodeSVG value={qrData} size={256} />
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            {result.course_code} - {result.course_title}
          </p>
          <p className="text-xs text-gray-500">
            Scan this QR code to verify the authenticity of this record
          </p>
        </div>
      </div>
    </div>
  );
};

// Wallet Connection Component
const WalletConnection: React.FC = () => {
  const { open } = useAppKit();
  const { isConnected, address } = useAccount();
  const { isAuthenticated } = useAuth();

  const handleConnect = async (): Promise<void> => {
    try {
      open();
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error('Failed to connect wallet');
    }
  };

  if (isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">Wallet Connected</p>
        <p className="text-sm text-gray-500 font-mono">{address}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
      <p className="text-gray-600 mb-6">
        Connect your wallet to access your academic records
      </p>
      <button
        onClick={handleConnect}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        Connect Wallet
      </button>
    </div>
  );
};

// Main Student Portal Component
const StudentPortal: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useAccount();

  if (!isConnected && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <WalletConnection />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link to="/student" className="text-xl font-bold text-gray-900">
              Student Portal
            </Link>
            <div className="flex space-x-4">
              <Link
                to="/student"
                className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/student/results"
                className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                Results
              </Link>
              <Link
                to="/"
                className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/results" element={<Results />} />
          <Route path="/qr/:id" element={<QRCodeView />} />
        </Routes>
      </div>
    </div>
  );
};

export default StudentPortal;

