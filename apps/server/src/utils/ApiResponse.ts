// class ApiResponse {
//     constructor(statusCode, data, message = "Success"){
//         this.statusCode = statusCode
//         this.data = data
//         this.message = message
//         this.success = statusCode < 400
//     }
// }

// export { ApiResponse }

class ApiResponse<T>{
    statusCode: number
    message: string = "Success"
    success: boolean = true
    data:T 

    constructor(
        statusCode: number,
        data: any,
        message: string = "Success"
    ){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}
export { ApiResponse }