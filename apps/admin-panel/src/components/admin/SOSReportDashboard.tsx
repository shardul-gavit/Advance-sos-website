import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  AlertTriangle, 
  MapPin, 
  Users, 
  Phone, 
  Video,
  Mic,
  Calendar,
  Filter,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  TrendingUp,
  BarChart3,
  Clock,
  User,
  Building,
  Car,
  Shield,
  Zap,
  RefreshCw,
  Printer,
  Share2
} from 'lucide-react';

interface SOSReport {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhone: string;
  latitude: number;
  longitude: number;
  address: string;
  emergencyType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'resolved' | 'cancelled' | 'timeout';
  triggerTime: Date;
  responseTime: Date;
  resolutionTime: Date;
  totalDuration: number; // in minutes
  description: string;
  assignedHelpers: Array<{
    id: string;
    name: string;
    phone: string;
    assignedTime: Date;
    arrivalTime?: Date;
    responseTime: number; // in minutes
  }>;
  assignedResponders: Array<{
    id: string;
    name: string;
    organization: string;
    phone: string;
    assignedTime: Date;
    arrivalTime?: Date;
    responseTime: number; // in minutes
  }>;
  mediaFiles: Array<{
    id: string;
    type: 'audio' | 'video' | 'image';
    url: string;
    timestamp: Date;
    duration?: number;
    size: number; // in MB
  }>;
  resolutionNotes: string;
  feedback?: {
    rating: number;
    comment: string;
  };
  costAnalysis: {
    helperCost: number;
    responderCost: number;
    totalCost: number;
  };
  performanceMetrics: {
    responseTimeScore: number; // 1-10
    resolutionTimeScore: number; // 1-10
    userSatisfactionScore: number; // 1-10
    overallScore: number; // 1-10
  };
}

interface ReportStats {
  totalReports: number;
  resolvedReports: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  averageCost: number;
  averageRating: number;
  topEmergencyType: string;
  mostActiveHour: string;
  costSavings: number;
}

export default function SOSReportDashboard() {
  const [reports, setReports] = useState<SOSReport[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    resolvedReports: 0,
    averageResponseTime: 0,
    averageResolutionTime: 0,
    averageCost: 0,
    averageRating: 0,
    topEmergencyType: '',
    mostActiveHour: '',
    costSavings: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<SOSReport | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockReports: SOSReport[] = [
      {
        id: 'report-001',
        eventId: 'sos-hist-001',
        userId: 'user-123',
        userName: 'John Doe',
        userPhone: '+91 98765 43210',
        latitude: 22.3321,
        longitude: 73.1586,
        address: 'Vadodara, Gujarat, India',
        emergencyType: 'Medical Emergency',
        priority: 'critical',
        status: 'resolved',
        triggerTime: new Date(Date.now() - 86400000), // 1 day ago
        responseTime: new Date(Date.now() - 86395000), // 8.5 minutes later
        resolutionTime: new Date(Date.now() - 86370000), // 50 minutes later
        totalDuration: 50,
        description: 'Chest pain and difficulty breathing. Patient was experiencing severe chest pain.',
        assignedHelpers: [
          {
            id: 'helper-001',
            name: 'Dr. Sarah Wilson',
            phone: '+91 98765 43211',
            assignedTime: new Date(Date.now() - 86398000),
            arrivalTime: new Date(Date.now() - 86390000),
            responseTime: 13.3
          }
        ],
        assignedResponders: [
          {
            id: 'responder-001',
            name: 'Ambulance Team Alpha',
            organization: 'Vadodara Emergency Services',
            phone: '+91 98765 43212',
            assignedTime: new Date(Date.now() - 86398000),
            arrivalTime: new Date(Date.now() - 86370000),
            responseTime: 50
          }
        ],
        mediaFiles: [
          {
            id: 'media-001',
            type: 'audio',
            url: '/audio/sos-001-recording.mp3',
            timestamp: new Date(Date.now() - 86395000),
            duration: 120,
            size: 2.4
          },
          {
            id: 'media-002',
            type: 'video',
            url: '/video/sos-001-stream.mp4',
            timestamp: new Date(Date.now() - 86395000),
            duration: 3000,
            size: 45.6
          }
        ],
        resolutionNotes: 'Patient transported to hospital. Stable condition. Follow-up required.',
        feedback: {
          rating: 5,
          comment: 'Excellent response time and professional care. Thank you!'
        },
        costAnalysis: {
          helperCost: 2500,
          responderCost: 15000,
          totalCost: 17500
        },
        performanceMetrics: {
          responseTimeScore: 9,
          resolutionTimeScore: 8,
          userSatisfactionScore: 10,
          overallScore: 9
        }
      },
      {
        id: 'report-002',
        eventId: 'sos-hist-002',
        userId: 'user-456',
        userName: 'Jane Smith',
        userPhone: '+91 98765 43213',
        latitude: 22.3350,
        longitude: 73.1600,
        address: 'Near Railway Station, Vadodara',
        emergencyType: 'Fire Emergency',
        priority: 'high',
        status: 'resolved',
        triggerTime: new Date(Date.now() - 172800000), // 2 days ago
        responseTime: new Date(Date.now() - 172794000), // 10 minutes later
        resolutionTime: new Date(Date.now() - 172680000), // 3.2 hours later
        totalDuration: 200,
        description: 'Building fire with smoke visible. Multiple people trapped.',
        assignedHelpers: [
          {
            id: 'helper-002',
            name: 'Fire Safety Expert Mike',
            phone: '+91 98765 43214',
            assignedTime: new Date(Date.now() - 172798000),
            arrivalTime: new Date(Date.now() - 172790000),
            responseTime: 13.3
          }
        ],
        assignedResponders: [
          {
            id: 'responder-002',
            name: 'Fire Department Unit 1',
            organization: 'Vadodara Fire Department',
            phone: '+91 98765 43215',
            assignedTime: new Date(Date.now() - 172798000),
            arrivalTime: new Date(Date.now() - 172794000),
            responseTime: 6.7
          },
          {
            id: 'responder-003',
            name: 'Police Unit Bravo',
            organization: 'Vadodara Police',
            phone: '+91 98765 43216',
            assignedTime: new Date(Date.now() - 172796000),
            arrivalTime: new Date(Date.now() - 172792000),
            responseTime: 6.7
          }
        ],
        mediaFiles: [
          {
            id: 'media-003',
            type: 'video',
            url: '/video/sos-002-fire.mp4',
            timestamp: new Date(Date.now() - 172794000),
            duration: 12000,
            size: 180.2
          },
          {
            id: 'media-004',
            type: 'image',
            url: '/images/sos-002-smoke.jpg',
            timestamp: new Date(Date.now() - 172794000),
            size: 3.2
          }
        ],
        resolutionNotes: 'Fire extinguished successfully. All occupants evacuated safely. No injuries reported.',
        feedback: {
          rating: 4,
          comment: 'Quick response and efficient evacuation. Very professional team.'
        },
        costAnalysis: {
          helperCost: 3000,
          responderCost: 25000,
          totalCost: 28000
        },
        performanceMetrics: {
          responseTimeScore: 8,
          resolutionTimeScore: 7,
          userSatisfactionScore: 8,
          overallScore: 8
        }
      }
    ];

    const mockStats: ReportStats = {
      totalReports: 247,
      resolvedReports: 189,
      averageResponseTime: 8.5,
      averageResolutionTime: 45.2,
      averageCost: 18500,
      averageRating: 4.2,
      topEmergencyType: 'Medical Emergency',
      mostActiveHour: '2:00 PM - 3:00 PM',
      costSavings: 125000
    };

    setTimeout(() => {
      setReports(mockReports);
      setStats(mockStats);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Refreshing SOS report data...');
      
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload mock data
      const mockReports: SOSReport[] = [
        {
          id: 'report-001',
          eventId: 'sos-001',
          userId: 'user-123',
          userName: 'John Doe',
          userPhone: '+1-555-0123',
          latitude: 22.3321,
          longitude: 73.1586,
          address: '123 Emergency St, City, State 12345',
          emergencyType: 'Medical Emergency',
          priority: 'critical',
          status: 'resolved',
          triggerTime: new Date('2024-01-15T14:30:00Z'),
          responseTime: new Date('2024-01-15T14:32:00Z'),
          resolutionTime: new Date('2024-01-15T15:45:00Z'),
          totalDuration: 75,
          description: 'Chest pain and difficulty breathing. Patient was conscious but in distress.',
          assignedHelpers: [
            { id: 'helper-001', name: 'Dr. Sarah Johnson', phone: '+1-555-0101', assignedTime: new Date('2024-01-15T14:32:00Z'), arrivalTime: new Date('2024-01-15T14:45:00Z') }
          ],
          assignedResponders: [
            { id: 'responder-001', name: 'EMS Team Alpha', organization: 'City Emergency Services', phone: '+1-555-0201', assignedTime: new Date('2024-01-15T14:32:00Z'), arrivalTime: new Date('2024-01-15T14:50:00Z') }
          ],
          mediaFiles: [
            { id: 'media-001', type: 'video', url: 'https://example.com/video1.mp4', timestamp: new Date('2024-01-15T14:30:00Z'), duration: 120 },
            { id: 'media-002', type: 'audio', url: 'https://example.com/audio1.mp3', timestamp: new Date('2024-01-15T14:30:00Z'), duration: 180 }
          ],
          resolutionNotes: 'Patient transported to hospital. Stable condition. Follow-up required.',
          feedback: { rating: 5, comment: 'Excellent response time and care.' },
          costAnalysis: {
            responseCost: 2500,
            medicalCost: 15000,
            totalCost: 17500,
            insuranceCoverage: 14000,
            outOfPocket: 3500
          },
          timeline: [
            { timestamp: new Date('2024-01-15T14:30:00Z'), event: 'SOS triggered', description: 'Emergency button pressed' },
            { timestamp: new Date('2024-01-15T14:32:00Z'), event: 'Response initiated', description: 'Helper and responder assigned' },
            { timestamp: new Date('2024-01-15T14:45:00Z'), event: 'Helper arrived', description: 'Dr. Sarah Johnson on scene' },
            { timestamp: new Date('2024-01-15T14:50:00Z'), event: 'EMS arrived', description: 'Ambulance and medical team on scene' },
            { timestamp: new Date('2024-01-15T15:45:00Z'), event: 'Resolved', description: 'Patient transported to hospital' }
          ]
        }
      ];

      const mockStats: ReportStats = {
        totalReports: mockReports.length,
        resolvedReports: mockReports.filter(r => r.status === 'resolved').length,
        averageResponseTime: 2.5,
        averageResolutionTime: 75,
        averageRating: 4.8,
        topEmergencyType: 'Medical Emergency',
        mostActiveHour: '2:00 PM - 3:00 PM',
        costSavings: 15000
      };

      setReports(mockReports);
      setStats(mockStats);
      console.log('✅ SOS report data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing SOS report data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-400';
      case 'cancelled': return 'text-gray-400';
      case 'timeout': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // PDF Download Handlers
  const handleDownloadReport = (report: SOSReport) => {
    // Create a comprehensive PDF report
    const reportData = {
      id: report.id,
      eventId: report.eventId,
      userName: report.userName,
      userPhone: report.userPhone,
      address: report.address,
      emergencyType: report.emergencyType,
      priority: report.priority,
      status: report.status,
      triggerTime: report.triggerTime.toLocaleString(),
      responseTime: report.responseTime.toLocaleString(),
      resolutionTime: report.resolutionTime.toLocaleString(),
      totalDuration: formatDuration(report.totalDuration),
      description: report.description,
      assignedHelpers: report.assignedHelpers,
      assignedResponders: report.assignedResponders,
      mediaFiles: report.mediaFiles,
      resolutionNotes: report.resolutionNotes,
      feedback: report.feedback,
      costAnalysis: report.costAnalysis,
      performanceMetrics: report.performanceMetrics
    };

    // Generate PDF content
    const pdfContent = generatePDFContent(reportData);
    
    // Create and download PDF
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SOS_Report_${report.id}_${report.triggerTime.toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handlePrintReport = (report: SOSReport) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = generatePrintContent(report);
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShareReport = (report: SOSReport) => {
    if (navigator.share) {
      navigator.share({
        title: `SOS Report - ${report.id}`,
        text: `Emergency Report for ${report.userName} - ${report.emergencyType}`,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`SOS Report - ${report.id}\nEmergency: ${report.emergencyType}\nUser: ${report.userName}\nStatus: ${report.status}`);
      alert('Report link copied to clipboard');
    }
  };

  const generatePDFContent = (reportData: any) => {
    // This is a simplified PDF generation - in a real app, you'd use a library like jsPDF
    return `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 1000
>>
stream
BT
/F1 12 Tf
50 750 Td
(SOS EMERGENCY REPORT) Tj
0 -20 Td
(Report ID: ${reportData.id}) Tj
0 -15 Td
(Event ID: ${reportData.eventId}) Tj
0 -15 Td
(Generated: ${new Date().toLocaleString()}) Tj
0 -30 Td
(EMERGENCY DETAILS) Tj
0 -15 Td
(User: ${reportData.userName}) Tj
0 -15 Td
(Phone: ${reportData.userPhone}) Tj
0 -15 Td
(Address: ${reportData.address}) Tj
0 -15 Td
(Emergency Type: ${reportData.emergencyType}) Tj
0 -15 Td
(Priority: ${reportData.priority.toUpperCase()}) Tj
0 -15 Td
(Status: ${reportData.status.toUpperCase()}) Tj
0 -30 Td
(TIMELINE) Tj
0 -15 Td
(Triggered: ${reportData.triggerTime}) Tj
0 -15 Td
(Response: ${reportData.responseTime}) Tj
0 -15 Td
(Resolved: ${reportData.resolutionTime}) Tj
0 -15 Td
(Duration: ${reportData.totalDuration}) Tj
0 -30 Td
(DESCRIPTION) Tj
0 -15 Td
(${reportData.description}) Tj
0 -30 Td
(PERFORMANCE METRICS) Tj
0 -15 Td
(Overall Score: ${reportData.performanceMetrics.overallScore}/10) Tj
0 -15 Td
(Response Time Score: ${reportData.performanceMetrics.responseTimeScore}/10) Tj
0 -15 Td
(Resolution Time Score: ${reportData.performanceMetrics.resolutionTimeScore}/10) Tj
0 -15 Td
(User Satisfaction: ${reportData.performanceMetrics.userSatisfactionScore}/10) Tj
0 -30 Td
(COST ANALYSIS) Tj
0 -15 Td
(Helper Cost: ${formatCurrency(reportData.costAnalysis.helperCost)}) Tj
0 -15 Td
(Responder Cost: ${formatCurrency(reportData.costAnalysis.responderCost)}) Tj
0 -15 Td
(Total Cost: ${formatCurrency(reportData.costAnalysis.totalCost)}) Tj
0 -30 Td
(RESOLUTION NOTES) Tj
0 -15 Td
(${reportData.resolutionNotes}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000001295 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1394
%%EOF
    `;
  };

  const generatePrintContent = (report: SOSReport) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>SOS Report - ${report.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .metric { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SOS EMERGENCY REPORT</h1>
        <p><strong>Report ID:</strong> ${report.id} | <strong>Event ID:</strong> ${report.eventId}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h3>Emergency Details</h3>
        <div class="info-grid">
            <div><strong>User:</strong> ${report.userName}</div>
            <div><strong>Phone:</strong> ${report.userPhone}</div>
            <div><strong>Address:</strong> ${report.address}</div>
            <div><strong>Emergency Type:</strong> ${report.emergencyType}</div>
            <div><strong>Priority:</strong> ${report.priority.toUpperCase()}</div>
            <div><strong>Status:</strong> ${report.status.toUpperCase()}</div>
        </div>
    </div>

    <div class="section">
        <h3>Timeline</h3>
        <div class="info-grid">
            <div><strong>Triggered:</strong> ${report.triggerTime.toLocaleString()}</div>
            <div><strong>Response:</strong> ${report.responseTime.toLocaleString()}</div>
            <div><strong>Resolved:</strong> ${report.resolutionTime.toLocaleString()}</div>
            <div><strong>Duration:</strong> ${formatDuration(report.totalDuration)}</div>
        </div>
    </div>

    <div class="section">
        <h3>Description</h3>
        <p>${report.description}</p>
    </div>

    <div class="section">
        <h3>Performance Metrics</h3>
        <div class="info-grid">
            <div class="metric"><strong>Overall Score:</strong> ${report.performanceMetrics.overallScore}/10</div>
            <div class="metric"><strong>Response Time Score:</strong> ${report.performanceMetrics.responseTimeScore}/10</div>
            <div class="metric"><strong>Resolution Time Score:</strong> ${report.performanceMetrics.resolutionTimeScore}/10</div>
            <div class="metric"><strong>User Satisfaction:</strong> ${report.performanceMetrics.userSatisfactionScore}/10</div>
        </div>
    </div>

    <div class="section">
        <h3>Cost Analysis</h3>
        <div class="info-grid">
            <div><strong>Helper Cost:</strong> ${formatCurrency(report.costAnalysis.helperCost)}</div>
            <div><strong>Responder Cost:</strong> ${formatCurrency(report.costAnalysis.responderCost)}</div>
            <div><strong>Total Cost:</strong> ${formatCurrency(report.costAnalysis.totalCost)}</div>
        </div>
    </div>

    <div class="section">
        <h3>Resolution Notes</h3>
        <p>${report.resolutionNotes}</p>
    </div>

    ${report.feedback ? `
    <div class="section">
        <h3>User Feedback</h3>
        <p><strong>Rating:</strong> ${report.feedback.rating}/5 stars</p>
        <p><strong>Comment:</strong> ${report.feedback.comment}</p>
    </div>
    ` : ''}

    <div class="footer">
        <p>This report was generated by the SOS Emergency Management System</p>
        <p>For questions or concerns, please contact the system administrator</p>
    </div>
</body>
</html>
    `;
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.emergencyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesType = filterType === 'all' || report.emergencyType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-gray-400">Loading SOS Report Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-400" />
            <h1 className="text-2xl font-bold text-green-400">SOS Report Dashboard</h1>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-cyan-500/20 text-cyan-300 border-cyan-400 hover:bg-cyan-500/30 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <p className="text-gray-400">Comprehensive reports with full details from SOS trigger to resolution</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-black/50 border-green-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Total Reports</p>
                <p className="text-2xl font-bold text-green-400">{stats.totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-blue-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-blue-400">{stats.resolvedReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-purple-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Avg Rating</p>
                <p className="text-2xl font-bold text-purple-400">{stats.averageRating}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 border-orange-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Avg Cost</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(stats.averageCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-black/50 border-cyan-400/50 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, emergency type, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-600/50 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-md text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="resolved">Resolved</option>
                <option value="cancelled">Cancelled</option>
                <option value="timeout">Timeout</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-md text-white text-sm"
              >
                <option value="all">All Types</option>
                <option value="Medical Emergency">Medical Emergency</option>
                <option value="Fire Emergency">Fire Emergency</option>
                <option value="Traffic Accident">Traffic Accident</option>
                <option value="Natural Disaster">Natural Disaster</option>
                <option value="Security Threat">Security Threat</option>
              </select>
              <Button variant="outline" className="text-green-400 border-green-400 hover:bg-green-400/20">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="reports" className="h-full">
        <TabsList className="grid w-full grid-cols-4 bg-black/50 border-cyan-400/50">
          <TabsTrigger value="reports" className="text-cyan-300">Reports</TabsTrigger>
          <TabsTrigger value="analytics" className="text-cyan-300">Analytics</TabsTrigger>
          <TabsTrigger value="costs" className="text-cyan-300">Cost Analysis</TabsTrigger>
          <TabsTrigger value="details" className="text-cyan-300">Report Details</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4">
          <Card className="bg-black/50 border-cyan-400/50">
            <CardHeader>
              <CardTitle className="text-cyan-300">SOS Reports</CardTitle>
              <CardDescription>Complete reports with performance metrics and cost analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredReports.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <p>No reports found matching your criteria</p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <Card key={report.id} className="bg-gray-900/50 border-gray-600/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(report.priority)}`}></div>
                          <Badge variant="outline" className="text-red-400 border-red-400">
                            {report.priority.toUpperCase()}
                          </Badge>
                          <span className={`text-sm font-medium ${getStatusColor(report.status)}`}>
                            {report.status.toUpperCase()}
                          </span>
                          <Badge variant="outline" className="text-blue-400 border-blue-400">
                            {report.emergencyType}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">
                          {report.triggerTime.toLocaleDateString()} at {report.triggerTime.toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{report.userName}</h3>
                          <p className="text-sm text-gray-400">{report.userPhone}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{report.address}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-300 mb-2">{report.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{report.assignedHelpers.length} Helpers</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{report.assignedResponders.length} Responders</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-1">Duration</div>
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            {formatDuration(report.totalDuration)}
                          </Badge>
                          <div className="text-xs text-gray-400 mt-2">
                            Response: {Math.round((report.responseTime.getTime() - report.triggerTime.getTime()) / 60000)}m
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400 mb-1">Performance Score</div>
                          <div className={`text-lg font-bold ${getScoreColor(report.performanceMetrics.overallScore)}`}>
                            {report.performanceMetrics.overallScore}/10
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Cost: {formatCurrency(report.costAnalysis.totalCost)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          <span>{report.mediaFiles.filter(f => f.type === 'video').length} Videos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mic className="h-3 w-3" />
                          <span>{report.mediaFiles.filter(f => f.type === 'audio').length} Audio</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{report.mediaFiles.filter(f => f.type === 'image').length} Images</span>
                        </div>
                        {report.feedback && (
                          <div className="flex items-center gap-1">
                            <span>⭐ {report.feedback.rating}/5</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReport(report)}
                          className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                         <Button 
                           size="sm" 
                           variant="outline" 
                           onClick={() => handleDownloadReport(report)}
                           className="text-green-400 border-green-400 hover:bg-green-400/20"
                         >
                           <Download className="h-4 w-4 mr-1" />
                           Download PDF
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline" 
                           onClick={() => handlePrintReport(report)}
                           className="text-purple-400 border-purple-400 hover:bg-purple-400/20"
                         >
                           <Printer className="h-4 w-4 mr-1" />
                           Print
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline" 
                           onClick={() => handleShareReport(report)}
                           className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/20"
                         >
                           <Share2 className="h-4 w-4 mr-1" />
                           Share
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/50 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-300">Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Response Time (Target: 10m)</span>
                      <span className="text-blue-400">{stats.averageResponseTime}m</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Resolution Time (Target: 60m)</span>
                      <span className="text-green-400">{stats.averageResolutionTime}m</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">User Satisfaction</span>
                      <span className="text-yellow-400">{stats.averageRating}/5</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{width: '84%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-300">Emergency Type Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-400">Medical Emergency</span>
                    </div>
                    <span className="text-white font-medium">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-400">Fire Emergency</span>
                    </div>
                    <span className="text-white font-medium">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-400">Traffic Accident</span>
                    </div>
                    <span className="text-white font-medium">20%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-400">Security Threat</span>
                    </div>
                    <span className="text-white font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/50 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-300">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-400">Helper Costs</span>
                    <span className="text-green-400 font-medium">{formatCurrency(45000)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-400">Responder Costs</span>
                    <span className="text-blue-400 font-medium">{formatCurrency(180000)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                    <span className="text-gray-400">Equipment & Resources</span>
                    <span className="text-purple-400 font-medium">{formatCurrency(75000)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg border-t border-gray-600">
                    <span className="text-white font-semibold">Total Cost</span>
                    <span className="text-white font-bold text-lg">{formatCurrency(300000)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-300">Cost Savings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">{formatCurrency(stats.costSavings)}</div>
                  <div className="text-gray-400 mb-4">Total Savings This Month</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Efficiency Gains:</span>
                      <span className="text-green-400">+15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Resource Optimization:</span>
                      <span className="text-green-400">+22%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Response Time Improvement:</span>
                      <span className="text-green-400">+18%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Report Details Tab */}
        <TabsContent value="details" className="mt-4">
          {selectedReport ? (
            <Card className="bg-black/50 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-300">Detailed Report - {selectedReport.id}</CardTitle>
                <CardDescription>Complete analysis and performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Executive Summary */}
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-3">Executive Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{selectedReport.performanceMetrics.overallScore}/10</div>
                      <div className="text-sm text-gray-400">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{formatDuration(selectedReport.totalDuration)}</div>
                      <div className="text-sm text-gray-400">Total Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{formatCurrency(selectedReport.costAnalysis.totalCost)}</div>
                      <div className="text-sm text-gray-400">Total Cost</div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Response Time</span>
                        <span className={`font-bold ${getScoreColor(selectedReport.performanceMetrics.responseTimeScore)}`}>
                          {selectedReport.performanceMetrics.responseTimeScore}/10
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        {Math.round((selectedReport.responseTime.getTime() - selectedReport.triggerTime.getTime()) / 60000)} minutes
                      </div>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Resolution Time</span>
                        <span className={`font-bold ${getScoreColor(selectedReport.performanceMetrics.resolutionTimeScore)}`}>
                          {selectedReport.performanceMetrics.resolutionTimeScore}/10
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        {formatDuration(selectedReport.totalDuration)}
                      </div>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">User Satisfaction</span>
                        <span className={`font-bold ${getScoreColor(selectedReport.performanceMetrics.userSatisfactionScore)}`}>
                          {selectedReport.performanceMetrics.userSatisfactionScore}/10
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        {selectedReport.feedback ? `${selectedReport.feedback.rating}/5 stars` : 'No feedback'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Analysis */}
                <div>
                  <h3 className="font-semibold text-white mb-3">Cost Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Helper Costs</div>
                      <div className="text-lg font-bold text-green-400">{formatCurrency(selectedReport.costAnalysis.helperCost)}</div>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Responder Costs</div>
                      <div className="text-lg font-bold text-blue-400">{formatCurrency(selectedReport.costAnalysis.responderCost)}</div>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Total Cost</div>
                      <div className="text-lg font-bold text-orange-400">{formatCurrency(selectedReport.costAnalysis.totalCost)}</div>
                    </div>
                  </div>
                </div>

                 {/* Action Buttons */}
                 <div className="flex gap-2">
                   <Button 
                     onClick={() => handleDownloadReport(selectedReport)}
                     className="bg-green-500 hover:bg-green-600 text-white"
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Download Full Report
                   </Button>
                   <Button 
                     variant="outline" 
                     onClick={() => handlePrintReport(selectedReport)}
                     className="text-blue-400 border-blue-400 hover:bg-blue-400/20"
                   >
                     <Printer className="h-4 w-4 mr-2" />
                     Print Report
                   </Button>
                   <Button 
                     variant="outline" 
                     onClick={() => handleShareReport(selectedReport)}
                     className="text-purple-400 border-purple-400 hover:bg-purple-400/20"
                   >
                     <Share2 className="h-4 w-4 mr-2" />
                     Share Report
                   </Button>
                 </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black/50 border-cyan-400/50">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Select a report to view detailed information</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
