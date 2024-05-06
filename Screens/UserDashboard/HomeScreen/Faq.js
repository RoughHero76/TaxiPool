import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const FAQItem = ({ question, answer }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={toggleAnswer} style={styles.questionContainer}>
        <Text style={styles.questionText}>{question}</Text>
        <Text>{showAnswer ? '-' : '+'}</Text>
      </TouchableOpacity>
      {showAnswer && <Text style={styles.answerText}>{answer}</Text>}
    </View>
  );
};

const Accordion = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Frequently Asked Questions</Text>
      <FAQItem
        question="What is Lorem Ipsum?"
        answer="Lorem Ipsum is simply dummy text of the printing and typesetting industry."
      />
      <FAQItem
        question="Why do we use it?"
        answer="It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout."
      />
      <FAQItem
        question="Where does it come from?"
        answer="Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 20,
    color: 'black'
  },
  itemContainer: {
    marginBottom: 10,
  },
  questionContainer: {
    padding: 10,
    backgroundColor: '#ECECEC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color:'black',
  },
  answerText: {
    fontSize: 16,
    marginLeft: 20,
    color:'black',
  },
});

export default Accordion;
