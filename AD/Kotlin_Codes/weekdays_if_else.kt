// Program to display weekdays using if-else statement
fun main() {
    print("Enter a day number (1-7): ")
    val day = readLine()!!.toInt()

    if (day == 1) {
        println("Monday")
    } else if (day == 2) {
        println("Tuesday")
    } else if (day == 3) {
        println("Wednesday")
    } else if (day == 4) {
        println("Thursday")
    } else if (day == 5) {
        println("Friday")
    } else if (day == 6) {
        println("Saturday")
    } else if (day == 7) {
        println("Sunday")
    } else {
        println("Invalid input, please enter a number between 1 and 7.")
    }
}
