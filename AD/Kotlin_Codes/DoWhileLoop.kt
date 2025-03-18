
// Code7: Take input until user enters 0 and sum them
fun main() {
    var sum = 0
    var input: Int
    do {
        print("Enter integer: ")
        input = readLine()!!.toInt()
        sum += input
    } while (input != 0)
    println("Total sum: $sum")
}
