import { ProjectRepository } from '../repositories/project.js';
import { OrganizationAuthorizationService } from '../../organizations/services/authorization.js';
import {
  ConflictError,
  NotFoundError,
  AuthorizationError,
} from '../../../errors/index.js';
import { MembershipRole, Project } from '@prisma/client';
import { logger } from '../../../logger/index.js';

export class ProjectService {
  /**
   * Creates a new project in the organization.
   */
  public static async create(
    operatorUserId: string,
    organizationId: string,
    data: {
      name: string;
      slug: string;
      description?: string;
      metadata?: Record<string, unknown>;
      settings?: Record<string, unknown>;
    },
  ): Promise<Project> {
    // 1. Assert creator has permission (Owner, Admin, or Project Maintainer)
    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        organizationId,
      );

    if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to create projects.',
      );
    }

    // 2. Validate unique project name per organization
    const existingName = await ProjectRepository.findByName(
      organizationId,
      data.name,
    );
    if (existingName) {
      throw new ConflictError(
        'A project with this name already exists in this organization.',
      );
    }

    // 3. Validate unique project slug per organization
    const existingSlug = await ProjectRepository.findBySlug(
      organizationId,
      data.slug,
    );
    if (existingSlug) {
      throw new ConflictError(
        'A project with this slug already exists in this organization.',
      );
    }

    // 4. Create project
    const project = await ProjectRepository.create({
      organizationId,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      metadata: data.metadata || {},
      settings: data.settings || {},
    });

    logger.info(
      { organizationId, projectId: project.id, operatorUserId },
      'Project created successfully.',
    );
    return project;
  }

  /**
   * Updates an existing project.
   */
  public static async update(
    operatorUserId: string,
    projectId: string,
    updates: {
      name?: string;
      description?: string;
      metadata?: Record<string, unknown>;
      settings?: Record<string, unknown>;
    },
  ): Promise<Project> {
    // 1. Find project
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    // 2. Assert membership
    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    // 3. RBAC checks: Developers can only update metadata; Others can update anything
    if (operatorRole === MembershipRole.DEVELOPER) {
      if (
        updates.name !== undefined ||
        updates.description !== undefined ||
        updates.settings !== undefined
      ) {
        throw new AuthorizationError(
          'Access denied. Developers can only update project metadata.',
        );
      }
    } else if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to update project details.',
      );
    }

    // 4. Check name conflict
    if (updates.name && updates.name !== project.name) {
      const existingName = await ProjectRepository.findByName(
        project.organizationId,
        updates.name,
      );
      if (existingName) {
        throw new ConflictError(
          'A project with this name already exists in this organization.',
        );
      }
    }

    // 5. Save updates
    const updated = await ProjectRepository.update(projectId, updates);
    logger.info({ projectId, operatorUserId }, 'Project updated successfully.');
    return updated;
  }

  /**
   * Archives a project.
   */
  public static async archive(
    operatorUserId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to archive project.',
      );
    }

    const updated = await ProjectRepository.update(projectId, {
      isArchived: true,
    });
    logger.warn({ projectId, operatorUserId }, 'Project archived.');
    return updated;
  }

  /**
   * Restores an archived project.
   */
  public static async restore(
    operatorUserId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to restore project.',
      );
    }

    const updated = await ProjectRepository.update(projectId, {
      isArchived: false,
    });
    logger.info({ projectId, operatorUserId }, 'Project restored.');
    return updated;
  }

  /**
   * Soft deletes a project.
   */
  public static async delete(
    operatorUserId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    const operatorRole =
      await OrganizationAuthorizationService.assertMembership(
        operatorUserId,
        project.organizationId,
      );

    if (
      operatorRole !== MembershipRole.ORG_OWNER &&
      operatorRole !== MembershipRole.ORG_ADMIN &&
      operatorRole !== MembershipRole.PROJECT_MAINTAINER
    ) {
      throw new AuthorizationError(
        'Access denied. Insufficient privileges to delete project.',
      );
    }

    const deleted = await ProjectRepository.softDelete(projectId);
    logger.warn({ projectId, operatorUserId }, 'Project soft deleted.');
    return deleted;
  }
}
