import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FolderOpen, Download, Upload, Search } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { mockComplianceApi } from '@/mock/api'
import { toast } from 'sonner'
import { G, PageHeader, DarkBtn, OutlineBtn, ContentCard } from '@/shared/components/GrayKpi'

const CATEGORIES = ['All', 'GST', 'TDS', 'Audit', 'Legal', 'Financials', 'Notices']
const CLIENTS = ['All Clients', 'Sunrise Textiles', 'BlueSky Tech', 'Redwood Constructions', 'Green Pharma', 'Apex Auto Parts']
const CLIENT_IDS: Record<string, number | null> = {
  'All Clients': null, 'Sunrise Textiles': 1, 'BlueSky Tech': 2,
  'Redwood Constructions': 3, 'Green Pharma': 4, 'Apex Auto Parts': 5,
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  return ext === 'pdf' ? '📄' : ext === 'xlsx' || ext === 'xls' ? '📊' : ext === 'docx' || ext === 'doc' ? '📝' : '📎'
}

export function DocumentsPage() {
  const [selectedClient, setSelectedClient] = useState('All Clients')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'folder' | 'list'>('folder')

  const clientId = CLIENT_IDS[selectedClient]
  const { data: docs = [] } = useQuery({
    queryKey: ['documents', clientId, selectedCategory],
    queryFn: () => mockComplianceApi.documents({ client_id: clientId, category: selectedCategory === 'All' ? undefined : selectedCategory }).then(r => r.data),
  })

  const searchFiltered = (docs as any[]).filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.client_name.toLowerCase().includes(search.toLowerCase()))

  const byCategory: Record<string, any[]> = {}
  searchFiltered.forEach(d => { if (!byCategory[d.category]) byCategory[d.category] = []; byCategory[d.category].push(d) })

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto" style={{ background: G.canvas }}>
      <PageHeader title="Document Management" sub="Centralized repository — Client › FY › Category">
        <DarkBtn onClick={() => toast.info('Upload document')}><Upload className="h-4 w-4" />Upload</DarkBtn>
      </PageHeader>

      {/* Filters row — single horizontal line */}
      <div className="flex items-center gap-2 mb-6 rounded-2xl p-3" style={{ background: G.white, border: `1px solid ${G.border}` }}>
        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: G.icon }} />
          <input type="search" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)}
            className="rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none"
            style={{ width: 200, background: G.canvas, border: `1px solid ${G.border}`, color: G.primary }} />
        </div>

        {/* Divider */}
        <div className="w-px h-6 shrink-0" style={{ background: G.border }} />

        {/* Client dropdown */}
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          className="rounded-xl px-2.5 py-1.5 text-xs outline-none shrink-0 cursor-pointer"
          style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.primary }}>
          {CLIENTS.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Divider */}
        <div className="w-px h-6 shrink-0" style={{ background: G.border }} />

        {/* Category pills — scrollable */}
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all"
              style={selectedCategory === cat
                ? { background: G.primary, color: '#FFFFFF' }
                : { background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary }}>
              {cat}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-0.5 rounded-xl p-0.5 shrink-0" style={{ background: G.canvas, border: `1px solid ${G.border}` }}>
          {(['folder', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="rounded-lg px-3 py-1 text-xs font-semibold"
              style={view === v ? { background: G.primary, color: '#FFFFFF' } : { color: G.secondary }}>
              {v === 'folder' ? 'Folders' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {view === 'folder' ? (
        <div className="space-y-6">
          {Object.entries(byCategory).length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <FolderOpen className="h-12 w-12" style={{ color: G.icon }} />
              <p className="text-sm" style={{ color: G.secondary }}>No documents found</p>
            </div>
          ) : Object.entries(byCategory).map(([cat, files]) => (
            <div key={cat}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: G.primary }}>
                <FolderOpen className="h-4 w-4" style={{ color: G.icon }} />
                {cat}
                <span className="font-normal" style={{ color: G.icon }}>({files.length})</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {files.map(doc => (
                  <div key={doc.id} className="rounded-2xl p-4 transition-all"
                    style={{ background: G.white, border: `1px solid ${G.border}`, boxShadow: '0 1px 3px 0 rgba(15,23,42,0.06)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = G.border}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{fileIcon(doc.name)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-snug truncate" style={{ color: G.primary }} title={doc.name}>{doc.name}</p>
                        <p className="text-[10px] mt-1" style={{ color: G.secondary }}>{doc.client_name}</p>
                        <p className="text-[10px]" style={{ color: G.icon }}>{doc.fy} · {(doc.size_kb / 1024).toFixed(1)} MB</p>
                        <p className="text-[10px]" style={{ color: G.icon }}>{format(parseISO(doc.uploaded_at), 'd MMM yyyy')} · v{doc.version}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <OutlineBtn className="w-full justify-center" onClick={() => toast.success(`Downloading ${doc.name}`)}>
                        <Download className="h-3 w-3" /> Download
                      </OutlineBtn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ContentCard>
          <div className="p-5">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Client</th><th>FY</th><th>Category</th><th>Size</th><th>Uploaded</th><th>Ver</th><th /></tr></thead>
              <tbody>
                {searchFiltered.map(doc => (
                  <tr key={doc.id} className="cursor-pointer" onClick={() => toast.info(`Opening ${doc.name}`)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{fileIcon(doc.name)}</span>
                        <span style={{ fontWeight: 500 }}>{doc.name}</span>
                      </div>
                    </td>
                    <td>{doc.client_name}</td>
                    <td>{doc.fy}</td>
                    <td>
                      <span className="rounded-full text-[10px] font-semibold"
                        style={{ background: G.canvas, border: `1px solid ${G.border}`, color: G.secondary, padding: '1px 6px' }}>
                        {doc.category}
                      </span>
                    </td>
                    <td>{(doc.size_kb / 1024).toFixed(1)} MB</td>
                    <td>{format(parseISO(doc.uploaded_at), 'd MMM yyyy')}</td>
                    <td>v{doc.version}</td>
                    <td>
                      <button onClick={e => { e.stopPropagation(); toast.success('Downloading') }}
                        className="text-xs font-semibold" style={{ color: '#0584C7' }}>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      )}
    </div>
  )
}
