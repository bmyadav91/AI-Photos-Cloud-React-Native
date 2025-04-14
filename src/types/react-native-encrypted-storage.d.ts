declare module 'react-native-encrypted-storage' {
  /**
   * Stores a string in the encrypted storage.
   * @param key The key to store the value under.
   * @param value The value to store.
   * @returns A promise that resolves when the value is stored.
   */
  function setItem(key: string, value: string): Promise<void>;
  
  /**
   * Retrieves a string from the encrypted storage.
   * @param key The key to retrieve the value for.
   * @returns A promise that resolves to the stored value, or null if not found.
   */
  function getItem(key: string): Promise<string | null>;
  
  /**
   * Removes an item from the encrypted storage.
   * @param key The key to remove.
   * @returns A promise that resolves when the item is removed.
   */
  function removeItem(key: string): Promise<void>;
  
  /**
   * Clears all items from the encrypted storage.
   * @returns A promise that resolves when all items are cleared.
   */
  function clearStorage(): Promise<void>;
  
  export default {
    setItem,
    getItem,
    removeItem,
    clearStorage
  };
} 