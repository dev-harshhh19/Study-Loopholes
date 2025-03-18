
// Code5: Simple calculator using user input
fun main() {
    print("Enter first number: ")
    val a = readLine()!!.toInt()
    
    print("Enter operator (+, -, *, /): ")
    val operator = readLine()!!
    
    print("Enter second number: ")
    val b = readLine()!!.toInt()
    
    val result = when (operator) {
        "+" -> a + b
        "-" -> a - b
        "*" -> a * b
        "/" -> a / b
        else -> "Invalid operator"
    }
    
    println("Result: $result")
}
