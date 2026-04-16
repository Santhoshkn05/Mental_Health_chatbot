// Authentication utilities

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('mindease-sessions'); // Clear chat sessions
};

export const deleteAccount = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found');
    return false;
  }
  
  try {
    console.log('Attempting to delete account...');
    const response = await fetch('http://localhost:3001/api/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Delete account response status:', response.status);
    
    if (response.ok) {
      logout(); // Clear all local data
      console.log('Account deleted successfully');
      return true;
    } else {
      const errorData = await response.json();
      console.error('Delete account failed:', errorData);
      return false;
    }
  } catch (error) {
    console.error('Delete account error:', error);
    return false;
  }
};
