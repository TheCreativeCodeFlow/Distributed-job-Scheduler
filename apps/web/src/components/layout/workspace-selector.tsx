'use client';

import React from 'react';
import { Building2, FolderGit } from 'lucide-react';
import { useFiltersStore } from '../../store/filters';

const mockOrgs = [
  { id: 'org-default', name: 'Default Organization' },
  { id: 'org-acme', name: 'Acme Enterprise' },
  { id: 'org-staging', name: 'Staging Infrastructure' },
];

const mockProjects: Record<string, Array<{ id: string; name: string }>> = {
  'org-default': [
    { id: 'proj-api', name: 'Main Scheduler Core' },
    { id: 'proj-events', name: 'Transactional Event Bus' },
  ],
  'org-acme': [
    { id: 'proj-acme-billing', name: 'Billing Queue Processor' },
    { id: 'proj-acme-ml', name: 'ML Pipeline Workers' },
  ],
  'org-staging': [
    { id: 'proj-stage-tests', name: 'Staging Concurrency Suite' },
  ],
};

export function WorkspaceSelector() {
  const { filters, setFilters } = useFiltersStore();
  const currentOrg = filters.orgId || 'org-default';
  const currentProj =
    filters.projectId || mockProjects[currentOrg]?.[0]?.id || '';

  // Synchronize initial selections on load
  React.useEffect(() => {
    if (!filters.orgId || !filters.projectId) {
      const org = filters.orgId || 'org-default';
      const proj = filters.projectId || mockProjects[org]?.[0]?.id || '';
      setFilters({ orgId: org, projectId: proj });
    }
  }, [filters.orgId, filters.projectId, setFilters]);

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const org = e.target.value;
    const defaultProj = mockProjects[org]?.[0]?.id || '';
    setFilters({ orgId: org, projectId: defaultProj });
  };

  const handleProjChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ projectId: e.target.value });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto bg-muted/20 border border-border/80 rounded-xl p-2 select-none">
      {/* Org Selector */}
      <div className="flex items-center gap-2 w-full sm:w-auto px-2">
        <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
        <select
          value={currentOrg}
          onChange={handleOrgChange}
          className="bg-transparent text-xs font-semibold text-foreground border-none focus:outline-none cursor-pointer focus:ring-0 w-full sm:w-36"
          aria-label="Select Organization"
        >
          {mockOrgs.map((org) => (
            <option
              key={org.id}
              value={org.id}
              className="bg-card text-foreground"
            >
              {org.name}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block h-4 w-px bg-border" />

      {/* Project Selector */}
      <div className="flex items-center gap-2 w-full sm:w-auto px-2">
        <FolderGit className="h-4 w-4 text-violet-400 flex-shrink-0" />
        <select
          value={currentProj}
          onChange={handleProjChange}
          className="bg-transparent text-xs font-semibold text-foreground border-none focus:outline-none cursor-pointer focus:ring-0 w-full sm:w-36"
          aria-label="Select Project"
        >
          {(mockProjects[currentOrg] || []).map((proj) => (
            <option
              key={proj.id}
              value={proj.id}
              className="bg-card text-foreground"
            >
              {proj.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
export { mockOrgs, mockProjects };
