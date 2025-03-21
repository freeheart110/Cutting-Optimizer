import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReportsScreen from '../screens/ReportsScreen';
import { auth } from '../firebaseConfig';
import { getFirestore, collection, addDoc, query, getDocs } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve()),
  query: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      forEach: jest.fn((callback) =>
        callback({ data: () => ({ projectName: 'Project A' }) })
      ),
    })
  ),
}));

jest.mock('../firebaseConfig', () => ({
  auth: { currentUser: { uid: 'user123' } },
}));

describe('ReportsScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ReportsScreen route={{ params: {} }} navigation={{ goBack: jest.fn() }} />);
    expect(getByText('Report Summary')).toBeTruthy();
    expect(getByText('Save Report')).toBeTruthy();
  });

  it('allows entering project name and material type', () => {
    const { getByPlaceholderText } = render(<ReportsScreen route={{ params: {} }} navigation={{ goBack: jest.fn() }} />);
    const projectInput = getByPlaceholderText('Enter or select project name');
    const materialInput = getByPlaceholderText('Enter material type');

    fireEvent.changeText(projectInput, 'New Project');
    fireEvent.changeText(materialInput, 'Steel');

    expect(projectInput.props.value).toBe('New Project');
    expect(materialInput.props.value).toBe('Steel');
  });

  it('disables save button if not logged in', () => {
    jest.mock('../firebaseConfig', () => ({
      auth: { currentUser: null },
    }));

    const { getByText } = render(<ReportsScreen route={{ params: {} }} navigation={{ goBack: jest.fn() }} />);
    const saveButton = getByText('Login to Save Report');

    expect(saveButton).toBeTruthy();
  });

  it('saves report to Firestore on button press', async () => {
    const { getByText, getByPlaceholderText } = render(
      <ReportsScreen route={{ params: {} }} navigation={{ goBack: jest.fn() }} />
    );

    const projectInput = getByPlaceholderText('Enter or select project name');
    const materialInput = getByPlaceholderText('Enter material type');
    const saveButton = getByText('Save Report');

    fireEvent.changeText(projectInput, 'Project X');
    fireEvent.changeText(materialInput, 'Aluminum');

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        collection(getFirestore(), 'users', 'user123', 'reports'),
        expect.objectContaining({
          projectName: 'Project X',
          materialType: 'Aluminum',
        })
      );
    });
  });
});
