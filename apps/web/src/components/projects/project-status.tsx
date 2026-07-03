import { Badge } from '../ui/badge';
import type { Project } from '../../types/project';

export function ProjectStatus({ project }: { project: Project }) {
  if (project.isArchived) return <Badge variant="warning">Archived</Badge>;
  if (!project.isActive) return <Badge variant="secondary">Inactive</Badge>;
  return <Badge variant="success">Active</Badge>;
}
