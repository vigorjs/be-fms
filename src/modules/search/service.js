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
    if (!query || query.trim() === '') {
      throw createBadRequestError('Search query is required');
    }
  
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
  
    const searchTerm = {
      contains: query.trim(),
      mode: 'insensitive'
    };
  
    const userCondition = {
      OR: [
        { ownerId: userId },
        { accessLevel: 'PUBLIC' }
      ]
    };
  
    // 🆕 Tambahkan pencarian ke dalam name dan contentText
    const fileSearchCondition = {
      AND: [
        {
          OR: [
            { name: searchTerm },
            { contentText: searchTerm }
          ]
        },
        {
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
        }
      ]
    };
  
    const filesPromise = this.prisma.file.findMany({
      where: fileSearchCondition,
      take: limit,
      skip,
      orderBy: {
        updatedAt: 'desc'
      }
    });
  
    const totalFilesPromise = this.prisma.file.count({
      where: fileSearchCondition
    });
  
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
  
    const totalFoldersPromise = this.prisma.folder.count({
      where: {
        name: searchTerm,
        ...userCondition
      }
    });
  
    const [files, totalFiles, folders, totalFolders] = await Promise.all([
      filesPromise,
      totalFilesPromise,
      foldersPromise,
      totalFoldersPromise
    ]);
  
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