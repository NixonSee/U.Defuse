-- Sample Python Control Flow Quiz Questions

INSERT INTO quiz_questions (question, code_snippet, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic) VALUES
-- Easy Questions
('What will this code print?', 'x = 5\nif x > 3:\n    print("A")\nelse:\n    print("B")', 'A', 'B', 'Error', 'Nothing', 'A', 'easy', 'if-else'),
('What is the output?', 'for i in range(3):\n    print(i)', '0 1 2', '1 2 3', '0 1 2 3', 'Error', 'A', 'easy', 'loops'),
('What does this return?', 'x = 10\ny = 20\nresult = x if x > y else y\nprint(result)', '10', '20', 'True', 'False', 'B', 'easy', 'if-else'),

-- Medium Questions
('What will be printed?', 'x = 0\nwhile x < 3:\n    x += 1\n    if x == 2:\n        continue\n    print(x)', '1 3', '0 1 2', '1 2 3', '0 1 3', 'A', 'medium', 'loops'),
('What is the output?', 'def check(n):\n    return "Even" if n % 2 == 0 else "Odd"\nprint(check(7))', 'Even', 'Odd', 'Error', 'None', 'B', 'medium', 'functions'),
('What gets printed?', 'x = [1, 2, 3]\nfor i in x:\n    if i == 2:\n        break\n    print(i)', '1', '1 2', '1 2 3', 'Nothing', 'A', 'medium', 'loops'),

-- Hard Questions  
('What is the final value of count?', 'count = 0\nfor i in range(5):\n    for j in range(3):\n        if i == j:\n            count += 1\nprint(count)', '3', '5', '15', '0', 'A', 'hard', 'loops'),
('What will this print?', 'def func(x=[]):\n    x.append(1)\n    return x\nprint(len(func()))\nprint(len(func()))', '1 1', '1 2', '2 2', 'Error', 'B', 'hard', 'functions'),
('What is the output?', 'x = 5\ny = 10\nif x > 3 and y < 15:\n    print("A")\nelif x > 3 or y > 15:\n    print("B")\nelse:\n    print("C")', 'A', 'B', 'C', 'Error', 'A', 'hard', 'if-else'),

-- More Medium
('What gets printed?', 'for i in range(1, 4):\n    if i % 2 == 0:\n        print(i)', '2', '1 3', '1 2 3', '2 4', 'A', 'medium', 'loops'),
('What is the result?', 'x = [1, 2, 3, 4, 5]\nresult = sum([i for i in x if i % 2 == 0])\nprint(result)', '6', '9', '15', '5', 'A', 'medium', 'loops'),
('What will be printed?', 'x = True\ny = False\nif x and not y:\n    print("A")\nelif not x and y:\n    print("B")\nelse:\n    print("C")', 'A', 'B', 'C', 'Error', 'A', 'medium', 'if-else'),

-- More Easy
('What is printed?', 'x = 3\nif x == 3:\n    print("Yes")\nelse:\n    print("No")', 'Yes', 'No', 'Error', 'Nothing', 'A', 'easy', 'if-else'),
('What is the output?', 'count = 0\nfor i in range(5):\n    count += 1\nprint(count)', '4', '5', '6', 'Error', 'B', 'easy', 'loops'),
('What gets printed?', 'x = 10\nwhile x > 7:\n    print(x)\n    x -= 1', '10 9 8', '10 9 8 7', '9 8 7', 'Infinite loop', 'A', 'easy', 'loops'),

-- More Hard
('What is the output?', 'def mystery(n):\n    if n <= 1:\n        return n\n    return mystery(n-1) + mystery(n-2)\nprint(mystery(5))', '3', '5', '8', '13', 'B', 'hard', 'functions'),
('What gets printed?', 'x = [1, 2, 3]\ny = x\ny.append(4)\nprint(len(x))', '3', '4', 'Error', 'None', 'B', 'hard', 'lists'),
('What is the result?', 'result = ""\nfor i in range(3):\n    for j in range(2):\n        result += str(i)\nprint(result)', '001122', '012012', '000111222', '012345', 'A', 'hard', 'loops'),

-- Additional Variety
('What will print?', 'x = [1, 2, 3, 4]\nprint(x[1:3])', '[1, 2]', '[2, 3]', '[1, 2, 3]', '[2, 3, 4]', 'B', 'medium', 'lists'),
('What is the output?', 'def test(a, b=5):\n    return a + b\nprint(test(10))', '5', '10', '15', 'Error', 'C', 'medium', 'functions'),
('What gets printed?', 'x = {"a": 1, "b": 2}\nprint("a" in x)', 'True', 'False', '1', 'Error', 'A', 'medium', 'dictionaries');
