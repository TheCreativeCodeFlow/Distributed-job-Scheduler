import { ProjectRepository } from '../repositories/project.js';
import { OrganizationAuthorizationService } from '../../organizations/services/authorization.js';
import { NotFoundError } from '../../../errors/index.js';
import { Project } from '@prisma/client';

export class ProjectQueryService {
  /**
   * Lists all projects in an organization.
   * Enforces tenant isolation (requester must be a member of the organization).
   */
  public static async listForOrg(
    userId: string,
    organizationId: string,
  ): Promise<Project[]> {
    // Assert requester membership
    await OrganizationAuthorizationService.assertMembership(
      userId,
      organizationId,
    );

    return ProjectRepository.listForOrg(organizationId);
  }

  /**
   * Retrieves single project details.
   * Enforces tenant isolation.
   */
  public static async getProject(
    userId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    // Assert requester membership
    await OrganizationAuthorizationService.assertMembership(
      userId,
      project.organizationId,
    );

    return project;
  }
}
