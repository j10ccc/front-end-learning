package main

import (
	"io/ioutil"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
)

type database struct {
	Id    string `json:"id"`
	Name  string `json:"name"`
	Score string `json:"score"`
}

func Cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method

		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Headers", "Content-Type,AccessToken,X-CSRF-Token, Authorization, Token")
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Content-Type")
		c.Header("Access-Control-Allow-Credentials", "true")

		//放行所有OPTIONS方法
		if method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
		}
		// 处理请求
		c.Next()
	}
}
func getscore(id string) ([]string, []string, []int) {
	f, _ := os.Open("score.txt")
	list, _ := ioutil.ReadAll(f)
	var point [51]int
	var name [50]string
	var score [50]string
	var i = 0
	var first int
	var last int
	var flag = false
	var flagfind = false
	for index, value := range list {
		if flagfind {
			if value == 42 {
				if !flag {
					first = index
				} else {
					name[i] = string(list[first+1 : last])
					score[i] = string(list[last+1 : index])
					point[i+1] = index
					i++
					if i == 50 {
						break
					}
				}
				flag = !flag
			}
			if value == 58 {
				last = index
			}
		}
		if value == 35 {
			if flagfind {
				break
			}
			if !flag {
				first = index
			} else {
				if string(list[first+1:index]) == id {
					point[0] = index
					flagfind = true
				}
			}
			flag = !flag
		}
	}
	return name[0:i], score[0:i], point[0 : i+1]
}
func insertscore(pos int, score string, name string) {
	f, _ := os.Open("score.txt")
	list, _ := ioutil.ReadAll(f)
	file, _ := os.OpenFile("score.txt", os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0666)
	file.Write(list[:pos+1])
	file.WriteString("\n*" + name + ":" + score + "*")
	file.Write(list[pos+1:])
}
func insertgame(id string) int {
	f, _ := os.Open("score.txt")
	list, _ := ioutil.ReadAll(f)
	file, _ := os.OpenFile("score.txt", os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0666)
	file.WriteString("#" + id + "#\n")
	file.Write(list)
	return len([]byte(id)) + 1
}
func main() {
	router := gin.Default()
	router.Use(Cors())

	router.GET("/game", func(c *gin.Context) {
		id := c.Query("id")
		name, score, _ := getscore(id)
		c.JSON(http.StatusOK, gin.H{
			"name":  name,
			"score": score,
		})
	})

	router.POST("/game", func(c *gin.Context) {
		var data database
		c.BindJSON(&data)

		_, scorelist, point := getscore(data.Id)
		if point[0] == 0 {
			point[0] = insertgame(data.Id)
		}
		score, _ := strconv.ParseInt(data.Score, 10, 64)
		var pos = len(point) - 1
		for index, value := range scorelist {
			nowscore, _ := strconv.ParseInt(value, 10, 64)
			if score > nowscore {
				pos = index
				break
			}
		}
		if pos < 50 {
			insertscore(point[pos], strconv.FormatInt(score, 10), data.Name)
			c.JSON(http.StatusOK, gin.H{
				"message": "成功入榜",
			})
		} else {
			c.JSON(http.StatusOK, gin.H{
				"message": "未入榜",
			})
		}
	})
	router.Run(":8080")
}
