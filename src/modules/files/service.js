// src/modules/files/service.js
const fs = require('fs').promises;
const fsSync = require('fs'); // Add the synchronous version for existsSync
const path = require('path');
const crypto = require('crypto');
const FileParser = require('../../utils/fileParser');
const { 
  createBadRequestError, 
  createNotFoundError, 
  createForbiddenError 
} = require('../../utils/errors');

// Default storage path
const STORAGE_PATH = process.env.STORAGE_PATH || path.resolve(process.cwd(), 'storage');

class FileService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Create a folder
   */
  async createFolder(userId, { name, parentId = null }) {
    // Validate folder name
    if (!name || name.trim() === '') {
      throw createBadRequestError('Folder name is required');
    }

    // Check if parent folder exists and user has access
    if (parentId) {
      const parentFolder = await this.prisma.folder.findUnique({
        where: { id: parentId },
      });

      if (!parentFolder) {
        throw createNotFoundError('Parent folder not found');
      }

      if (parentFolder.ownerId !== userId) {
        throw createForbiddenError('You do not have permission to create folders here');
      }
    }

    // Check if folder with same name exists in same parent
    const existingFolder = await this.prisma.folder.findFirst({
      where: {
        name,
        parentId,
        ownerId: userId,
      },
    });

    if (existingFolder) {
      throw createBadRequestError(`Folder named '${name}' already exists`);
    }

    // Create the folder
    const folder = await this.prisma.folder.create({
      data: {
        name,
        ownerId: userId,
        parentId,
      },
    });

    return folder;
  }

  /**
   * Get folder by ID
   */
  async getFolderById(userId, folderId) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw createNotFoundError('Folder not found');
    }

    // Check if user has permission to access this folder
    if (folder.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to access this folder');
    }

    return folder;
  }

  /**
   * Get folder path (all parent folders)
   */
  async getFolderPath(userId, folderId) {
    // First, verify the folder exists and user has access
    const folder = await this.getFolderById(userId, folderId);
    
    // Build the path array (starts with My Drive as root)
    const path = [];
    
    // Check if this folder has a parent
    if (folder.parentId === null) {
      // This is a root-level folder, just add it to the path
      path.push(folder);
    } else {
      // This is a nested folder, build the entire path recursively
      await this.buildFolderPathRecursive(userId, folder, path);
    }
    
    // Reverse the path to get it in the correct order (root first)
    path.reverse();
    
    // Add the "My Drive" root at the beginning
    path.unshift({ id: null, name: "My Drive" });
    
    return { path };
  }
  
  /**
   * Helper function to recursively build folder path
   * @private
   */
  async buildFolderPathRecursive(userId, folder, path) {
    // Add the current folder to the path
    path.push(folder);
    
    // If this is a root-level folder, we're done
    if (folder.parentId === null) {
      return;
    }
    
    // Otherwise, get the parent folder
    const parentFolder = await this.prisma.folder.findUnique({
      where: { id: folder.parentId },
    });
    
    // If parent folder not found, we're done (shouldn't happen with proper DB integrity)
    if (!parentFolder) {
      return;
    }
    
    // Verify user has permission to access the parent folder
    if (parentFolder.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to access this folder path');
    }
    
    // Recursively build path with parent folder
    await this.buildFolderPathRecursive(userId, parentFolder, path);
  }

  /**
   * Get folder contents (files and folders)
   */
  async getFolderContents(userId, folderId = null) {
    // If no folder ID provided, get root folder contents
    const where = folderId ? { parentId: folderId } : { parentId: null };
    
    // Add owner check
    where.ownerId = userId;

    // Get folders
    const folders = await this.prisma.folder.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Get files
    const files = await this.prisma.file.findMany({
      where: {
        folderId,
        ownerId: userId,
      },
      orderBy: { name: 'asc' },
    });

    return {
      folders,
      files,
    };
  }

  /**
   * Get a list of all user's files (no folders), with optional filtering
   */
  async listFiles(userId, options = {}) {
    const {
      search = '',
      mimeType = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = options;

    const skip = (page - 1) * limit;
    const take = limit;

    // Build where conditions
    const where = {
      ownerId: userId,
    };

    // Add search if provided
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Add mime type filter if provided
    if (mimeType) {
      where.mimeType = {
        startsWith: mimeType,
        mode: 'insensitive',
      };
    }

    // Get files with pagination
    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      files,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Upload a file
   */
  async uploadFile(userId, file, { name, folderId = null, accessLevel = 'PRIVATE' }) {
    // Check if user has enough storage
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { storageQuota: true, storageUsed: true },
    });

    if (!user) {
      throw createNotFoundError('User not found');
    }

    const userStorageUsed = BigInt(user.storageUsed.toString());
    const userStorageQuota = BigInt(user.storageQuota.toString());
    const fileSize = BigInt(file.size);

    if (userStorageUsed + fileSize > userStorageQuota) {
      throw createBadRequestError('Storage quota exceeded');
    }

    // Check if folder exists and user has access
    if (folderId) {
      const folder = await this.prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        throw createNotFoundError('Folder not found');
      }

      if (folder.ownerId !== userId) {
        throw createForbiddenError('You do not have permission to upload to this folder');
      }
    }
    
    // Verify we have valid file data
    if (!file || !file.buffer || file.size === 0) {
      throw createBadRequestError('Invalid file: empty or missing file data');
    }
    
    // Buffer verification should be done in the plugin, but let's double-check
    const bufferSize = file.buffer.length;
    if (bufferSize !== file.size) {
      console.warn(`File size mismatch: reported ${file.size} bytes but buffer is ${bufferSize} bytes`); 
    }
    
    // Make sure we have a path to save the file
    const relativePath = `uploads/${userId}_${Date.now()}_${path.basename(file.filename)}`;
    const fullPath = path.join(STORAGE_PATH, relativePath);
    
    // Simpan file ke disk
  
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, file.buffer);

  // Ekstrak teks dari file
  let contentText = null;
  try {
    contentText = await FileParser.extractText(fullPath, file.mimetype);
    
    // Batasi ukuran teks jika terlalu besar (misal 1MB)
    if (contentText && contentText.length > 1000000) {
      contentText = contentText.substring(0, 1000000) + '... [TEXT TRUNCATED]';
    }
  } catch (error) {
    console.error('Error extracting text content:', error);
    contentText = null;
  }

  // Buat record file di database
  const fileRecord = await this.prisma.file.create({
    data: {
      name: name || file.filename,
      mimeType: file.mimetype,
      size: BigInt(file.size),
      path: relativePath,
      contentText, // Simpan teks yang diekstrak
      ownerId: userId,
      folderId,
      accessLevel,
    },
  });
    
    // If PUBLIC access level, generate a public token automatically
    if (accessLevel === 'PUBLIC' && !fileRecord.publicToken) {
      const token = crypto.randomBytes(32).toString('hex');
      
      // Update the file with the public token
      await this.prisma.file.update({
        where: { id: fileRecord.id },
        data: {
          publicToken: token,
        },
      });
      
      // Update our local copy of the record as well
      fileRecord.publicToken = token;
    }

    // Update user's storage usage
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        storageUsed: {
          increment: BigInt(file.size),
        },
      },
    });

    return fileRecord;
  }

  /**
   * Download a file
   */
  async downloadFile(userId, fileId) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: {
        shares: {
          where: { userId },
        },
      },
    });

    if (!file) {
      throw createNotFoundError('File not found');
    }

    // Check if user has access to file
    const hasAccess = file.ownerId === userId || 
                     file.accessLevel === 'PUBLIC' || 
                     (file.accessLevel === 'SHARED' && file.shares.length > 0);

    if (!hasAccess) {
      throw createForbiddenError('You do not have permission to download this file');
    }

    // Get file path
    const fullPath = path.join(STORAGE_PATH, file.path);

    try {
      // Read file from disk
      const fileBuffer = await fs.readFile(fullPath);
      
      // Verify the file size
      const actualSize = fileBuffer.length;
      const expectedSize = Number(file.size.toString());
      
      if (actualSize !== expectedSize) {
        console.warn(`File size mismatch for file ${fileId}: DB has ${expectedSize} bytes, actual file is ${actualSize} bytes`);
      }
      
      return {
        name: file.name,
        mimeType: file.mimeType || 'application/octet-stream', // Default mime type if not set
        size: actualSize, // Use actual size from buffer
        buffer: fileBuffer,
        originalSize: expectedSize // Include DB size for comparison
      };
    } catch (error) {
      console.error(`Error reading file ${fileId} at ${fullPath}: ${error.message}`);
      throw createNotFoundError('File content not found');
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(userId, fileId) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw createNotFoundError('File not found');
    }

    // Check if user has permission
    if (file.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to delete this file');
    }

    // Get file path
    const fullPath = path.join(STORAGE_PATH, file.path);

    // Delete file record from database
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    // Update user's storage usage
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        storageUsed: {
          decrement: BigInt(file.size),
        },
      },
    });

    // Try to delete file from disk
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error(`Error deleting file from disk: ${fullPath}`, error);
      // We don't throw an error here since we've already deleted the record
    }

    return { success: true };
  }

  /**
   * Delete a folder and its contents
   */
  async deleteFolder(userId, folderId) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        files: true,
      },
    });

    if (!folder) {
      throw createNotFoundError('Folder not found');
    }

    // Check if user has permission
    if (folder.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to delete this folder');
    }

    // First, recursively delete subfolders
    const subfolders = await this.prisma.folder.findMany({
      where: { parentId: folderId },
    });

    for (const subfolder of subfolders) {
      await this.deleteFolder(userId, subfolder.id);
    }

    // Delete all files in folder and update storage usage
    let totalSize = BigInt(0);
    for (const file of folder.files) {
      const fullPath = path.join(STORAGE_PATH, file.path);
      totalSize += file.size;

      // Try to delete file from disk
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        console.error(`Error deleting file from disk: ${fullPath}`, error);
        // Continue with deletion even if file not found on disk
      }
    }

    // Delete folder record (this will cascade delete all files)
    await this.prisma.folder.delete({
      where: { id: folderId },
    });

    // Update user's storage usage if files were deleted
    if (totalSize > BigInt(0)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          storageUsed: {
            decrement: totalSize,
          },
        },
      });
    }

    return { success: true };
  }

  /**
   * Share a file with a user
   */
  async shareFile(userId, fileId, targetEmail, permission = 'VIEW') {
    // Check if file exists and user owns it
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw createNotFoundError('File not found');
    }

    if (file.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to share this file');
    }

    // Find target user by email
    const targetUser = await this.prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!targetUser) {
      throw createNotFoundError('User to share with not found');
    }

    // Don't allow sharing with self
    if (targetUser.id === userId) {
      throw createBadRequestError('Cannot share file with yourself');
    }

    // Check if file is already shared with this user
    const existingShare = await this.prisma.fileShare.findUnique({
      where: {
        fileId_userId: {
          fileId,
          userId: targetUser.id,
        },
      },
    });

    if (existingShare) {
      // Update permission if share already exists
      const updatedShare = await this.prisma.fileShare.update({
        where: {
          id: existingShare.id,
        },
        data: {
          permission,
        },
      });
      return updatedShare;
    }

    // Create new share
    const share = await this.prisma.fileShare.create({
      data: {
        fileId,
        userId: targetUser.id,
        permission,
      },
    });

    // Update file access level if it's not already SHARED or PUBLIC
    if (file.accessLevel === 'PRIVATE') {
      await this.prisma.file.update({
        where: { id: fileId },
        data: {
          accessLevel: 'SHARED',
        },
      });
    }

    return share;
  }

  /**
   * Create a public link for a file
   */
  async createPublicLink(userId, fileId) {
    // Check if file exists and user owns it
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw createNotFoundError('File not found');
    }

    if (file.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to create a public link');
    }

    // Generate a unique token if one doesn't exist
    if (!file.publicToken) {
      const token = crypto.randomBytes(32).toString('hex');
      
      const updatedFile = await this.prisma.file.update({
        where: { id: fileId },
        data: {
          publicToken: token,
          accessLevel: 'PUBLIC',
        },
      });

      return {
        publicToken: updatedFile.publicToken,
        url: `/api/files/public/${updatedFile.publicToken}`
      };
    }

    // Return existing token
    return {
      publicToken: file.publicToken,
      url: `/api/files/public/${file.publicToken}`
    };
  }

  /**
   * Get file by public token
   */
  async getFileByPublicToken(token) {
    const file = await this.prisma.file.findUnique({
      where: { publicToken: token },
    });

    if (!file || file.accessLevel !== 'PUBLIC') {
      throw createNotFoundError('File not found or not public');
    }

    // Get file path
    const fullPath = path.join(STORAGE_PATH, file.path);

    try {
      // Read file from disk
      const fileBuffer = await fs.readFile(fullPath);
      
      // Verify the file size
      const actualSize = fileBuffer.length;
      const expectedSize = Number(file.size.toString());
      
      if (actualSize !== expectedSize) {
        console.warn(`Public file size mismatch for token ${token}: DB has ${expectedSize} bytes, actual file is ${actualSize} bytes`);
      }
      
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType || 'application/octet-stream', // Default mime type if not set
        size: actualSize, // Use actual size from buffer
        buffer: fileBuffer,
        originalSize: expectedSize // Include DB size for comparison
      };
    } catch (error) {
      console.error(`Error reading public file with token ${token} at ${fullPath}: ${error.message}`);
      throw createNotFoundError('File content not found');
    }
  }
  
  /**
   * Get file info by public token (metadata only, no file content)
   */
  async getFileInfoByPublicToken(token) {
    const file = await this.prisma.file.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        accessLevel: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!file || file.accessLevel !== 'PUBLIC') {
      throw createNotFoundError('File not found or not public');
    }
    
    // Convert BigInt to String for JSON serialization
    return {
      ...file,
      size: file.size.toString(), // Convert BigInt to String
    };
  }

  /**
   * Get user storage info
   */
  async getUserStorageInfo(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        storageQuota: true, 
        storageUsed: true 
      },
    });

    if (!user) {
      throw createNotFoundError('User not found');
    }

    // Ensure we're working with strings to avoid precision issues
    const storageQuota = user.storageQuota.toString();
    const storageUsed = user.storageUsed.toString();
    
    // Calculate usage percentage more precisely
    const usagePercentage = Number(user.storageUsed) > 0 
      ? Math.round((Number(user.storageUsed) * 100) / Number(user.storageQuota)) 
      : 0;

    return {
      storageQuota,
      storageUsed,
      storageAvailable: (BigInt(user.storageQuota) - BigInt(user.storageUsed)).toString(),
      usagePercentage
    };
  }

  /**
   * Rename a folder
   */
  async renameFolder(userId, folderId, newName) {
    // Validate folder name
    if (!newName || newName.trim() === '') {
      throw createBadRequestError('Folder name is required');
    }
    
    // Find the folder
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });
    
    if (!folder) {
      throw createNotFoundError('Folder not found');
    }
    
    // Check ownership
    if (folder.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to rename this folder');
    }
    
    // Check if another folder with the same name exists in the same parent
    const existingFolder = await this.prisma.folder.findFirst({
      where: {
        name: newName,
        parentId: folder.parentId,
        ownerId: userId,
        id: { not: folderId }, // Exclude the current folder
      },
    });
    
    if (existingFolder) {
      throw createBadRequestError(`Folder named '${newName}' already exists in this location`);
    }
    
    // Update the folder name
    const updatedFolder = await this.prisma.folder.update({
      where: { id: folderId },
      data: { name: newName.trim() },
    });
    
    return updatedFolder;
  }
  
  /**
   * Update folder access level
   */
  async updateFolderAccessLevel(userId, folderId, accessLevel) {
    // Validate access level
    const validAccessLevels = ['PRIVATE', 'SHARED', 'PUBLIC'];
    if (!validAccessLevels.includes(accessLevel)) {
      throw createBadRequestError('Invalid access level');
    }
    
    // Find the folder
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });
    
    if (!folder) {
      throw createNotFoundError('Folder not found');
    }
    
    // Check ownership
    if (folder.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to update this folder');
    }
    
    // Update the folder access level
    const updatedFolder = await this.prisma.folder.update({
      where: { id: folderId },
      data: { accessLevel },
    });
    
    return updatedFolder;
  }
  
  /**
   * Rename a file
   */
  async renameFile(userId, fileId, newName) {
    // Validate file name
    if (!newName || newName.trim() === '') {
      throw createBadRequestError('File name is required');
    }
    
    // Find the file
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });
    
    if (!file) {
      throw createNotFoundError('File not found');
    }
    
    // Check ownership
    if (file.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to rename this file');
    }
    
    // Check if another file with the same name exists in the same folder
    const existingFile = await this.prisma.file.findFirst({
      where: {
        name: newName,
        folderId: file.folderId,
        ownerId: userId,
        id: { not: fileId }, // Exclude the current file
      },
    });
    
    if (existingFile) {
      throw createBadRequestError(`File named '${newName}' already exists in this location`);
    }
    
    // Update the file name
    const updatedFile = await this.prisma.file.update({
      where: { id: fileId },
      data: { name: newName.trim() },
    });
    
    return updatedFile;
  }
  
  /**
   * Update file access level
   */
  async updateFileAccessLevel(userId, fileId, accessLevel) {
    // Validate access level
    const validAccessLevels = ['PRIVATE', 'SHARED', 'PUBLIC'];
    if (!validAccessLevels.includes(accessLevel)) {
      throw createBadRequestError('Invalid access level');
    }
    
    // Find the file
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });
    
    if (!file) {
      throw createNotFoundError('File not found');
    }
    
    // Check ownership
    if (file.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to update this file');
    }
    
    // If setting to PUBLIC, generate a public token if one doesn't exist
    let publicToken = file.publicToken;
    if (accessLevel === 'PUBLIC' && !publicToken) {
      publicToken = crypto.randomBytes(32).toString('hex');
    }
    
    // Update the file access level
    const updatedFile = await this.prisma.file.update({
      where: { id: fileId },
      data: { 
        accessLevel,
        ...(publicToken ? { publicToken } : {})
      },
    });
    
    return updatedFile;
  }
  
  /**
   * Share a folder with a user
   */
  async shareFolder(userId, folderId, targetEmail, permission = 'VIEW') {
    // Check if folder exists and user owns it
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw createNotFoundError('Folder not found');
    }

    if (folder.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to share this folder');
    }

    // Find target user by email
    const targetUser = await this.prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!targetUser) {
      throw createNotFoundError('User to share with not found');
    }

    // Don't allow sharing with self
    if (targetUser.id === userId) {
      throw createBadRequestError('Cannot share folder with yourself');
    }
    
    // First, update folder access level to SHARED if it's not already SHARED or PUBLIC
    if (folder.accessLevel === 'PRIVATE') {
      await this.prisma.folder.update({
        where: { id: folderId },
        data: {
          accessLevel: 'SHARED',
        },
      });
    }

    // Create new share entry in the database
    // Note: We need to add a FolderShare model to the database schema
    // For now, we'll structure the response like a FileShare
    return {
      id: 0, // Placeholder
      folderId,
      userId: targetUser.id,
      permission,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  /**
   * Create a public link for a folder
   */
  async createFolderPublicLink(userId, folderId) {
    // Check if folder exists and user owns it
    const folder = await this.prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      throw createNotFoundError('Folder not found');
    }

    if (folder.ownerId !== userId) {
      throw createForbiddenError('You do not have permission to create a public link');
    }

    // Update folder to be public
    await this.prisma.folder.update({
      where: { id: folderId },
      data: {
        accessLevel: 'PUBLIC',
      },
    });

    // Generate a token (note: we need to add publicToken field to Folder model)
    const token = crypto.randomBytes(32).toString('hex');
    
    return {
      publicToken: token,
      url: `/api/files/folders/${folderId}/public`
    };
  }
}

module.exports = FileService;