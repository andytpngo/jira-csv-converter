from csv import writer, reader
import sys
import os

def convert_csv_a_to_csv_b(csv_a_path):
    base_name = os.path.splitext(csv_a_path)[0]  # Get base name without extension
    csv_b_path = f"{base_name}_jira_formatted.csv"
    header = ['Summary', 'Assignee', 'Time Spent (hours)', 'Issue Type', 'Issue ID', 'Parent']

    try:
        with open(csv_a_path, 'r', newline='', encoding='utf-8') as input_csv:
            csv_reader = reader(input_csv, delimiter=',', quotechar='"')
            lines = [list(map(str.strip, line[1:])) for line in csv_reader if line]

        employees, start_index = [], None
        for i, line in enumerate(lines):
            if line and line[0] == 'Web Development - Task Description':
                employees = [emp for emp in line[1:] if emp]
                start_index = i
                break
        if not employees:
            raise ValueError("No employees found in the CSV file.")

        issue_id, parent_id = 1, None
        parent_summary = ''

        with open(csv_b_path, 'w', newline='', encoding='utf-8') as output_csv:
            csv_writer = writer(output_csv)
            csv_writer.writerow(header)

            for line in lines[start_index + 1:]:
                if len(line) >= len(employees):
                    description = line[0]
                    is_parent = all(not val for val in line[2:])  # Checks if it's a parent

                    if is_parent:
                        parent_summary = f'{parent_summary} {description}' if parent_summary else description
                        continue

                    if parent_summary:
                        # If there's a stacked parent summary, write now as an Epic
                        csv_writer.writerow([parent_summary, '', '', 'Epic', issue_id, ''])
                        parent_id = issue_id
                        issue_id += 1
                        parent_summary = ''  # Reset parent summary after writing

                    if description:
                        for i, employee in enumerate(employees):
                            hours = line[i + 1]
                            if hours and hours.isdigit() and int(hours) <= 12:
                                summary = f'{description} - {employee}'
                                # Child issues are written as Tasks
                                csv_writer.writerow([summary, employee, hours, 'Task', issue_id, parent_id])
                            issue_id += 1

            # Check if there's an unwritten parent summary left at the end without any children
            if parent_summary:
                csv_writer.writerow([parent_summary, '', '', 'Epic', issue_id, ''])

    except FileNotFoundError:
        sys.exit("Error: The file specified was not found.")
    except PermissionError:
        sys.exit("Error: Permission denied when attempting to read or write to the file.")
    except ValueError as e:
        sys.exit(f"Error: {e}")
    except Exception as e:
        sys.exit(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    csv_a_file_path = input("Enter the path of CSV A: ")
    convert_csv_a_to_csv_b(csv_a_file_path)
