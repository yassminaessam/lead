import { useState } from 'react';
import { useCRM } from '../contexts/CRMContext';
import { useAuth } from '../contexts/AuthContext';
import { Lead } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Card } from '../components/ui/card';
import {
  Search, 
  Filter, 
  Plus, 
  Phone, 
  Mail, 
  Globe,
  Download,
  Eye,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  X,
  CheckSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import CallModal from '../components/CallModal';
import AddLeadModal from '../components/AddLeadModal';
import EditLeadModal from '../components/EditLeadModal';
import { useLanguage } from '../contexts/LanguageContext';

export default function LeadsPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { leads, users, deleteLead, updateLead } = useCRM();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [cardFilter, setCardFilter] = useState<string>('all');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [assignToUserId, setAssignToUserId] = useState<string>('');

  const isAdmin = currentUser?.role === 'admin';
  const salesUsers = users.filter(u => u.role === 'sales' || u.role === 'manager');

  const handleCardClick = (filter: string) => {
    setCardFilter(prev => prev === filter ? 'all' : filter);
    setStatusFilter('all');
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesIndustry = industryFilter === 'all' || lead.industry === industryFilter;

    let matchesCard = true;
    if (cardFilter === 'closed') matchesCard = lead.status === 'closed';
    else if (cardFilter === 'followup') matchesCard = lead.status === 'followup' || lead.status === 'meeting';
    else if (cardFilter === 'new') matchesCard = lead.status === 'new';

    return matchesSearch && matchesStatus && matchesIndustry && matchesCard;
  });

  const getStatusBadge = (status: string) => {
    // Using rgba colors that work in both light and dark modes
    const colors: Record<string, { bg: string; text: string }> = {
      new: { bg: 'rgba(147, 167, 255, 0.2)', text: 'rgba(102, 126, 234, 1)' },
      contacted: { bg: 'rgba(196, 167, 255, 0.2)', text: 'rgba(139, 92, 246, 1)' },
      followup: { bg: 'rgba(251, 191, 36, 0.2)', text: 'rgba(245, 158, 11, 1)' },
      meeting: { bg: 'rgba(110, 231, 183, 0.2)', text: 'rgba(16, 185, 129, 1)' },
      closed: { bg: 'rgba(110, 231, 183, 0.2)', text: 'rgba(16, 185, 129, 1)' },
      lost: { bg: 'rgba(248, 113, 113, 0.2)', text: 'rgba(239, 68, 68, 1)' },
    };

    const labels: Record<string, string> = {
      new: language === 'ar' ? 'جديد' : 'New',
      contacted: language === 'ar' ? 'تم التواصل' : 'Contacted',
      followup: language === 'ar' ? 'متابعة' : 'Follow Up',
      meeting: language === 'ar' ? 'اجتماع' : 'Meeting',
      closed: language === 'ar' ? 'مغلق' : 'Closed',
      lost: language === 'ar' ? 'خسارة' : 'Lost',
    };

    const colorScheme = colors[status] || colors.new;
    return (
      <Badge 
        className="border-0" 
        style={{ 
          backgroundColor: colorScheme.bg, 
          color: colorScheme.text 
        }}
      >
        {labels[status]}
      </Badge>
    );
  };

  const handleCall = (lead: Lead) => {
    setSelectedLead(lead);
    setIsCallModalOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setIsEditModalOpen(true);
  };

  const handleDelete = (lead: Lead) => {
    if (window.confirm(language === 'ar' ? `هل تريد حذف "${lead.company_name}"؟` : `Delete "${lead.company_name}"?`)) {
      deleteLead(lead._id, currentUser?._id);
      toast.success(language === 'ar' ? 'تم حذف العميل' : 'Lead deleted');
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l._id)));
    }
  };

  const handleBulkAssign = () => {
    if (!assignToUserId) {
      toast.error(language === 'ar' ? 'يرجى اختيار الموظف أولاً' : 'Please select an employee first');
      return;
    }
    const count = selectedLeadIds.size;
    selectedLeadIds.forEach(id => {
      updateLead(id, { assigned_to: assignToUserId }, currentUser?._id);
    });
    const targetUser = users.find(u => u._id === assignToUserId);
    toast.success(
      language === 'ar'
        ? `تم تعيين ${count} عميل إلى ${targetUser?.name}`
        : `Assigned ${count} leads to ${targetUser?.name}`
    );
    setSelectedLeadIds(new Set());
    setAssignToUserId('');
  };

  const handleExportCSV = () => {
    // Mock CSV export
    const csv = [
      ['الشركة', 'الهاتف', 'البريد', 'الصناعة', 'المدينة', 'الحالة', 'المصدر'],
      ...filteredLeads.map(lead => [
        lead.company_name,
        lead.phone,
        lead.email || '',
        lead.industry,
        lead.city,
        lead.status,
        lead.source,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 group hover:bg-primary/20 transition-all duration-300">
            <Users className="h-10 w-10 text-primary transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('leads')}</h1>
            <p className="text-gray-500">{t('manage_customer_base')}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className={`${language === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('export_csv')}
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className={`${language === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('add_customer')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">{t('search')}</label>
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
            <Input
              placeholder={language === 'ar' ? 'ابحث عن شركة، هاتف، أو بريد...' : 'Search for company, phone, or email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={language === 'ar' ? 'pr-10' : 'pl-10'}
            />
          </div>
        </div>
        <div className="w-48">
          <label className="text-sm font-medium mb-2 block">{t('status')}</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="new">{t('new')}</SelectItem>
              <SelectItem value="contacted">{t('contacted')}</SelectItem>
              <SelectItem value="followup">{t('followup')}</SelectItem>
              <SelectItem value="meeting">{t('meeting')}</SelectItem>
              <SelectItem value="closed">{t('closed')}</SelectItem>
              <SelectItem value="lost">{t('lost')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <label className="text-sm font-medium mb-2 block">{t('industry')}</label>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="مقاولات">{language === 'ar' ? 'مقاولات' : 'Construction'}</SelectItem>
              <SelectItem value="عيادات">{language === 'ar' ? 'عيادات' : 'Clinics'}</SelectItem>
              <SelectItem value="سياحة">{language === 'ar' ? 'سياحة' : 'Tourism'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div
          className="p-4 rounded-lg cursor-pointer transition-all duration-200"
          style={{
            backgroundColor: 'rgba(147, 167, 255, 0.15)',
            outline: cardFilter === 'all' ? '2px solid rgba(102, 126, 234, 0.8)' : 'none',
            transform: cardFilter === 'all' ? 'scale(1.02)' : 'none',
          }}
          onClick={() => handleCardClick('all')}
        >
          <div className="text-2xl font-bold" style={{ color: 'rgba(102, 126, 234, 0.9)' }}>{leads.length}</div>
          <div className="text-sm" style={{ color: 'rgba(102, 126, 234, 0.7)' }}>
            {language === 'ar' ? 'إجمالي النتائج' : 'Total Results'}
          </div>
        </div>
        <div
          className="p-4 rounded-lg cursor-pointer transition-all duration-200"
          style={{
            backgroundColor: 'rgba(110, 231, 183, 0.15)',
            outline: cardFilter === 'closed' ? '2px solid rgba(16, 185, 129, 0.8)' : 'none',
            transform: cardFilter === 'closed' ? 'scale(1.02)' : 'none',
          }}
          onClick={() => handleCardClick('closed')}
        >
          <div className="text-2xl font-bold" style={{ color: 'rgba(16, 185, 129, 0.9)' }}>
            {leads.filter(l => l.status === 'closed').length}
          </div>
          <div className="text-sm" style={{ color: 'rgba(16, 185, 129, 0.7)' }}>
            {language === 'ar' ? 'صفقات مغلقة' : 'Closed Deals'}
          </div>
        </div>
        <div
          className="p-4 rounded-lg cursor-pointer transition-all duration-200"
          style={{
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            outline: cardFilter === 'followup' ? '2px solid rgba(245, 158, 11, 0.8)' : 'none',
            transform: cardFilter === 'followup' ? 'scale(1.02)' : 'none',
          }}
          onClick={() => handleCardClick('followup')}
        >
          <div className="text-2xl font-bold" style={{ color: 'rgba(245, 158, 11, 0.9)' }}>
            {leads.filter(l => l.status === 'followup' || l.status === 'meeting').length}
          </div>
          <div className="text-sm" style={{ color: 'rgba(245, 158, 11, 0.7)' }}>
            {t('need_follow_up')}
          </div>
        </div>
        <div
          className="p-4 rounded-lg cursor-pointer transition-all duration-200"
          style={{
            backgroundColor: 'rgba(196, 167, 255, 0.15)',
            outline: cardFilter === 'new' ? '2px solid rgba(139, 92, 246, 0.8)' : 'none',
            transform: cardFilter === 'new' ? 'scale(1.02)' : 'none',
          }}
          onClick={() => handleCardClick('new')}
        >
          <div className="text-2xl font-bold" style={{ color: 'rgba(139, 92, 246, 0.9)' }}>
            {leads.filter(l => l.status === 'new').length}
          </div>
          <div className="text-sm" style={{ color: 'rgba(139, 92, 246, 0.7)' }}>
            {language === 'ar' ? 'عملاء جدد' : 'New Leads'}
          </div>
        </div>
      </div>

      {/* Bulk Assignment Bar (Admin only) */}
      {isAdmin && selectedLeadIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">
              {language === 'ar'
                ? `تم تحديد ${selectedLeadIds.size} عميل`
                : `${selectedLeadIds.size} leads selected`}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <Select value={assignToUserId} onValueChange={setAssignToUserId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder={language === 'ar' ? '\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0648\u0638\u0641' : 'Select employee'} />
              </SelectTrigger>
              <SelectContent>
                {salesUsers.map(u => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name} ({language === 'ar' ? (
                      u.role === 'sales' ? '\u0645\u0628\u064a\u0639\u0627\u062a' : '\u0645\u062f\u064a\u0631'
                    ) : u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkAssign} disabled={!assignToUserId}>
              <UserPlus className={`${language === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? '\u062a\u0639\u064a\u064a\u0646' : 'Assign'}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedLeadIds(new Set()); setAssignToUserId(''); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="card-hover overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length}
                    onCheckedChange={toggleSelectAll}
                    className="border-2 border-primary/60 h-5 w-5"
                  />
                </TableHead>
              )}
              <TableHead>{t('company')}</TableHead>
              <TableHead>{t('phone')}</TableHead>
              <TableHead>{t('industry')}</TableHead>
              <TableHead>{t('city')}</TableHead>
              <TableHead>{t('source')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('assigned_to')}</TableHead>
              <TableHead>{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => {
const assignedUser = users.find(u => u._id === lead.assigned_to);
              
              return (
                <TableRow key={lead._id} className={selectedLeadIds.has(lead._id) ? 'bg-primary/5' : ''}>
                  {isAdmin && (
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedLeadIds.has(lead._id)}
                        onCheckedChange={() => toggleSelectLead(lead._id)}
                        className="border-2 border-primary/60 h-5 w-5"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <div className="font-medium">{lead.company_name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                        )}
                        {lead.website && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {t('website')}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell dir="ltr" className="text-right">{lead.phone}</TableCell>
                  <TableCell>{lead.industry}</TableCell>
                  <TableCell>{lead.city}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.source}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>{assignedUser?.name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/dashboard/leads/${lead._id}`)}
                        title={language === 'ar' ? 'عرض' : 'View'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(lead)}
                        title={language === 'ar' ? 'تعديل' : 'Edit'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {currentUser?.role !== 'sales' && (
                        <Button
                          size="sm"
                          onClick={() => handleCall(lead)}
                          title={language === 'ar' ? 'اتصال' : 'Call'}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(lead)}
                        title={language === 'ar' ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Modals */}
      {selectedLead && (
        <CallModal
          lead={selectedLead}
          isOpen={isCallModalOpen}
          onClose={() => {
            setIsCallModalOpen(false);
            setSelectedLead(null);
          }}
        />
      )}

      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={() => {
          setIsAddModalOpen(false);
        }}
      />

      {editLead && (
        <EditLeadModal
          lead={editLead}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditLead(null);
          }}
        />
      )}
    </div>
  );
}