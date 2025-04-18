// src/modules/search/service.js
const { createBadRequestError } = require('../../utils/errors');

class SearchService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Search for files and folders
   */
  async search(userId, query, options = {}) {
    // Validate input
    if (!query || query.trim() === '') {
      throw createBadRequestError('Search query is required');
    }

    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    // Define search term for case-insensitive search
    const searchTerm = {
      contains: query.trim(),
      mode: 'insensitive'
    };

    // Shared conditions for user's own items
    // and items shared with the user
    const userCondition = {
      OR: [
        // User's own files/folders
        { ownerId: userId },
        // Shared items with PUBLIC access level 
        { accessLevel: 'PUBLIC' },
        // Shared items specifically with this user
        // (This is more complex and differs for files vs folders)
      ]
    };

    // Search for files with pagination
    const filesPromise = this.prisma.file.findMany({
      where: {
        name: searchTerm,
        ...userCondition,
        // For files, include files shared specifically with this user
        OR: [
          ...userCondition.OR,
          {
            accessLevel: 'SHARED', 
            shares: { 
              some: { 
                userId 
              } 
            }
          }
        ]
      },
      take: limit,
      skip,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Count total files matching search
    const totalFilesPromise = this.prisma.file.count({
      where: {
        name: searchTerm,
        ...userCondition
      }
    });

    // Search for folders with pagination
    const foldersPromise = this.prisma.folder.findMany({
      where: {
        name: searchTerm,
        ...userCondition
      },
      take: limit,
      skip,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Count total folders matching search
    const totalFoldersPromise = this.prisma.folder.count({
      where: {
        name: searchTerm,
        ...userCondition
      }
    });

    // Execute all promises in parallel
    const [files, totalFiles, folders, totalFolders] = await Promise.all([
      filesPromise,
      totalFilesPromise,
      foldersPromise,
      totalFoldersPromise
    ]);

    // Calculate total and total pages
    const total = totalFiles + totalFolders;
    const totalPages = Math.ceil(total / limit);

    return {
      files,
      folders,
      meta: {
        total,
        totalFiles,
        totalFolders,
        page,
        limit,
        totalPages
      }
    };
  }
}

module.exports = SearchService;