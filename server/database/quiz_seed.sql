INSERT INTO quiz_questions 
(question, code_snippet, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
VALUES
-- 1
('What will this print?', 'x = 10\nif x > 5:\n    print("Hi")', 'Hi', 'Nothing', 'Error', '5', 'A', 'easy', 'control-flow'),
-- 2
('What is the output?', 'x = 3\nif x == 3:\n    print("Yes")\nelse:\n    print("No")', 'Yes', 'No', '3', 'Error', 'A', 'easy', 'control-flow'),
-- 3
('What gets printed?', 'x = 1\nif x:\n    print("True")', 'True', 'False', '1', 'Nothing', 'A', 'easy', 'control-flow'),
-- 4
('What will the loop print?', 'for i in range(3):\n    print(i)', '0 1 2', '1 2 3', '0 1 2 3', 'Error', 'A', 'easy', 'control-flow'),
-- 5
('What happens here?', 'x = 0\nwhile x < 2:\n    print(x)\n    x += 1', '0 1', '1 2', '0 1 2', 'Infinite loop', 'A', 'easy', 'control-flow'),
-- 6
('What prints?', 'x = 5\nif x > 10:\n    print("A")\nelse:\n    print("B")', 'A', 'B', '5', 'Error', 'B', 'easy', 'control-flow'),
-- 7
('What is printed?', 'for i in range(2):\n    print("Hello")', 'Hello Hello', 'Hello', '2', 'Error', 'A', 'easy', 'control-flow'),
-- 8
('What is the output?', 'x = 4\nif x % 2 == 0:\n    print("Even")', 'Even', 'Odd', '4', 'Nothing', 'A', 'easy', 'control-flow'),
-- 9
('What does this print?', 'x = 3\ny = 5\nif x < y:\n    print("Small")', 'Small', 'Big', 'Equal', 'Error', 'A', 'easy', 'control-flow'),
-- 10
('What will print?', 'for i in range(3):\n    if i == 1:\n        print("Middle")', 'Middle', '1', 'Middle Middle', 'Error', 'A', 'easy', 'control-flow'),
-- 11
('What happens?', 'x = 2\nif x > 1:\n    print("A")\nprint("B")', 'A B', 'A', 'B', 'Error', 'A', 'easy', 'control-flow'),
-- 12
('What is printed?', 'x = 0\nwhile x < 1:\n    print("Loop")\n    x += 1', 'Loop', 'Loop Loop', 'Nothing', 'Error', 'A', 'easy', 'control-flow'),
-- 13
('What is the output?', 'for i in range(2):\n    print(i * 2)', '0 2', '2 4', '0 1', 'Error', 'A', 'easy', 'control-flow'),
-- 14
('What gets printed?', 'x = 7\nif x != 7:\n    print("A")\nelse:\n    print("B")', 'A', 'B', '7', 'Nothing', 'B', 'easy', 'control-flow'),
-- 15
('What is printed?', 'x = 1\nif x > 0:\n    print("Positive")', 'Positive', 'Negative', '0', 'Error', 'A', 'easy', 'control-flow'),
-- 16
('What will print?', 'for i in range(1):\n    print("One")', 'One', 'One One', 'Nothing', 'Error', 'A', 'easy', 'control-flow'),
-- 17
('What happens here?', 'x = True\nif x:\n    print("OK")', 'OK', 'True', 'False', 'Nothing', 'A', 'easy', 'control-flow'),
-- 18
('What is printed?', 'x = 5\nif x < 2:\n    print("Low")\nelse:\n    print("High")', 'Low', 'High', '5', 'Error', 'B', 'easy', 'control-flow'),
-- 19
('What is the output?', 'for i in range(4):\n    if i == 3:\n        print("Done")', 'Done', '3', 'Done Done', 'Error', 'A', 'easy', 'control-flow'),
-- 20
('What gets printed?', 'x = 2\ny = 4\nif x < y and y > 3:\n    print("OK")', 'OK', '2', '4', 'Nothing', 'A', 'easy', 'control-flow'),
-- 21
('What prints?', 'for i in range(2):\n    continue\nprint("End")', 'End', '2', 'Nothing', 'Error', 'A', 'easy', 'control-flow'),
-- 22
('What is printed?', 'x = 3\nif x > 1:\n    print("A")\nelif x > 2:\n    print("B")', 'A', 'B', 'A B', 'Nothing', 'A', 'easy', 'control-flow'),
-- 23
('What happens?', 'x = 0\nif not x:\n    print("Zero")', 'Zero', '0', 'False', 'Nothing', 'A', 'easy', 'control-flow'),
-- 24
('What prints?', 'for i in range(3):\n    if i == 0:\n        print("Start")', 'Start', 'Start Start', '0', 'Nothing', 'A', 'easy', 'control-flow'),
-- 25
('What is the output?', 'x = 9\nif x % 3 == 0:\n    print("Divisible")', 'Divisible', '9', '3', 'Error', 'A', 'easy', 'control-flow'),
-- 26
('What will print?', 'i = 0\nwhile i < 3:\n    print(i)\n    break', '0', '0 1 2', 'Nothing', 'Error', 'A', 'easy', 'control-flow'),
-- 27
('What gets printed?', 'x = 4\ny = 4\nif x == y:\n    print("Equal")', 'Equal', '4', 'True', 'Nothing', 'A', 'easy', 'control-flow'),
-- 28
('What is the output?', 'for i in range(3):\n    pass\nprint("Done")', 'Done', '3', 'Nothing', 'Error', 'A', 'easy', 'control-flow'),
-- 29
('What prints?', 'x = True\ny = False\nif x and not y:\n    print("Yes")', 'Yes', 'No', 'True', 'False', 'A', 'easy', 'control-flow'),
-- 30
('What will print?', 'x = "test"\nif x:\n    print("Not Empty")', 'Not Empty', 'Empty', 'test', 'Error', 'A', 'easy', 'control-flow');
