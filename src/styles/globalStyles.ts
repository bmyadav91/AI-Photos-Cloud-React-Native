import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: "#565959",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonIcon: {
    height: 20,
    width: 20,
    marginRight: 10,
  },
  disabledButton: {
    backgroundColor: "#737373",
    opacity: 0.5,
    color: "#fff",
  },
  notes: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  notesLink: {
    color: "#007bff",
    textDecorationLine: "underline",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  imgIcon: {
    width: 22,
    height: 22,
    tintColor: 'white',
  },
});

export default globalStyles;
