import { searchRepository, SearchOptions } from "../repositories/search.repository";
import { folderRepository } from "../repositories/folder.repository";

export class SearchService {
  /**
   * Comprehensive search across files and folders
   */
  async search(userId: string, options: SearchOptions) {
    const [fileResults, folders] = await Promise.all([
      searchRepository.searchFiles(userId, options),
      options.q ? searchRepository.searchFolders(userId, options.q) : Promise.resolve([]),
    ]);

    // Attach breadcrumbs to folders for clear context
    const foldersWithBreadcrumbs = await Promise.all(
      folders.map(async (folder) => {
        const breadcrumbs = await folderRepository.getBreadcrumbs(folder.id, userId);
        return {
          ...folder,
          breadcrumbs,
        };
      })
    );

    return {
      files: fileResults.files,
      folders: foldersWithBreadcrumbs,
      totalFiles: fileResults.total,
      totalFolders: folders.length,
      limit: fileResults.limit,
      offset: fileResults.offset,
    };
  }

  /**
   * Get recently modified/uploaded files
   */
  async getRecent(userId: string, limit = 30) {
    const files = await searchRepository.getRecentFiles(userId, limit);
    return { files };
  }

  /**
   * Get all starred files for a user
   */
  async getStarred(userId: string) {
    const files = await searchRepository.getStarredFiles(userId);
    return { files };
  }
}

export const searchService = new SearchService();
